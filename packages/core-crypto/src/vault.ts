import { VAULT_VERSION } from '@celestial/shared-types';
import type { AccountId, AesGcmPayload, EncryptedVault } from '@celestial/shared-types';
import { aesGcmDecrypt, aesGcmEncrypt } from './aes-gcm.js';
import { deriveVaultKey, generateSaltBase64Url } from './pbkdf2.js';
import { bytesToUtf8, utf8ToBytes } from './utils.js';

// Raw CEX credential object encrypted as JSON inside the vault.
export interface CexCredentialPlaintext {
  apiKey: string;
  secret: string;
  passphrase?: string;
}

// Creates a brand-new encrypted vault from a BIP-39 mnemonic string and a user password.
// The returned vault has no accounts or CEX credentials — add them via addAccountToVault.
export async function createVault(mnemonic: string, password: string): Promise<EncryptedVault> {
  const salt = generateSaltBase64Url();
  const key = await deriveVaultKey(password, salt);
  const encryptedMnemonic = await aesGcmEncrypt(key, utf8ToBytes(mnemonic));
  return {
    version: VAULT_VERSION,
    salt,
    mnemonic: encryptedMnemonic,
    accounts: {},
    cexCredentials: {},
  };
}

// Decrypts and returns the BIP-39 mnemonic string. Throws if the password is wrong.
export async function decryptVaultMnemonic(
  vault: EncryptedVault,
  password: string,
): Promise<string> {
  const key = await deriveVaultKey(password, vault.salt);
  const bytes = await aesGcmDecrypt(key, vault.mnemonic);
  return bytesToUtf8(bytes);
}

// Adds an encrypted account private-key material entry to the vault.
// `privateKeyMaterial` is the chain-specific key string:
//   EVM  → "0x"-prefixed 32-byte hex
//   SVM  → base58-encoded 64-byte keypair
//   BTC  → WIF-encoded compressed private key
export async function addAccountToVault(
  vault: EncryptedVault,
  password: string,
  accountId: AccountId,
  privateKeyMaterial: string,
): Promise<EncryptedVault> {
  const key = await deriveVaultKey(password, vault.salt);
  const encrypted = await aesGcmEncrypt(key, utf8ToBytes(privateKeyMaterial));
  return {
    ...vault,
    accounts: { ...vault.accounts, [accountId]: encrypted },
  };
}

// Decrypts and returns the private key material for a single account.
export async function decryptAccountKey(
  vault: EncryptedVault,
  password: string,
  accountId: AccountId,
): Promise<string> {
  const payload: AesGcmPayload | undefined = vault.accounts[accountId];
  if (!payload) throw new Error(`Account "${accountId}" not found in vault`);
  const key = await deriveVaultKey(password, vault.salt);
  const bytes = await aesGcmDecrypt(key, payload);
  return bytesToUtf8(bytes);
}

// Returns a new vault with the account entry removed. Does NOT require password
// because we are only dropping the ciphertext, not reading it.
export function removeAccountFromVault(
  vault: EncryptedVault,
  accountId: AccountId,
): EncryptedVault {
  const { [accountId]: _dropped, ...remainingAccounts } = vault.accounts;
  return { ...vault, accounts: remainingAccounts };
}

// Encrypts CEX API credentials and adds them to the vault under a UUID credentialId.
export async function addCexCredentialToVault(
  vault: EncryptedVault,
  password: string,
  credentialId: string,
  creds: CexCredentialPlaintext,
): Promise<EncryptedVault> {
  const key = await deriveVaultKey(password, vault.salt);
  const encrypted = await aesGcmEncrypt(key, utf8ToBytes(JSON.stringify(creds)));
  return {
    ...vault,
    cexCredentials: { ...vault.cexCredentials, [credentialId]: encrypted },
  };
}

// Decrypts and returns CEX credentials for a single credentialId.
export async function decryptCexCredential(
  vault: EncryptedVault,
  password: string,
  credentialId: string,
): Promise<CexCredentialPlaintext> {
  const payload: AesGcmPayload | undefined = vault.cexCredentials[credentialId];
  if (!payload) throw new Error(`CEX credential "${credentialId}" not found in vault`);
  const key = await deriveVaultKey(password, vault.salt);
  const bytes = await aesGcmDecrypt(key, payload);
  return JSON.parse(bytesToUtf8(bytes)) as CexCredentialPlaintext;
}

// Returns a new vault with the CEX credential entry removed.
export function removeCexCredentialFromVault(
  vault: EncryptedVault,
  credentialId: string,
): EncryptedVault {
  const { [credentialId]: _dropped, ...remaining } = vault.cexCredentials;
  return { ...vault, cexCredentials: remaining };
}

// Re-encrypts the entire vault under a new password and a fresh salt.
// Validates the old password first (decryption will throw on auth-tag failure if wrong).
export async function changeVaultPassword(
  vault: EncryptedVault,
  oldPassword: string,
  newPassword: string,
): Promise<EncryptedVault> {
  // Derive old key and bulk-decrypt everything to validate old password.
  const oldKey = await deriveVaultKey(oldPassword, vault.salt);

  const mnemonicBytes = await aesGcmDecrypt(oldKey, vault.mnemonic);

  const accountEntries = await Promise.all(
    Object.entries(vault.accounts).map(async ([id, payload]) => {
      const bytes = await aesGcmDecrypt(oldKey, payload);
      return [id, bytes] as const;
    }),
  );

  const cexEntries = await Promise.all(
    Object.entries(vault.cexCredentials).map(async ([id, payload]) => {
      const bytes = await aesGcmDecrypt(oldKey, payload);
      return [id, bytes] as const;
    }),
  );

  // Fresh salt + new key — rotating the salt on password change prevents precomputation attacks.
  const newSalt = generateSaltBase64Url();
  const newKey = await deriveVaultKey(newPassword, newSalt);

  const newMnemonic = await aesGcmEncrypt(newKey, mnemonicBytes);

  const newAccounts: Record<AccountId, AesGcmPayload> = {};
  for (const [id, bytes] of accountEntries) {
    newAccounts[id] = await aesGcmEncrypt(newKey, bytes);
  }

  const newCexCredentials: Record<string, AesGcmPayload> = {};
  for (const [id, bytes] of cexEntries) {
    newCexCredentials[id] = await aesGcmEncrypt(newKey, bytes);
  }

  return {
    version: VAULT_VERSION,
    salt: newSalt,
    mnemonic: newMnemonic,
    accounts: newAccounts,
    cexCredentials: newCexCredentials,
  };
}

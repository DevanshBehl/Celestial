// ---- Utilities -----------------------------------------------------------
export {
  toBase64Url,
  fromBase64Url,
  toBase64,
  fromBase64,
  toHex,
  fromHex,
  concatenate,
  randomBytes,
  utf8ToBytes,
  bytesToUtf8,
} from './utils.js';

// ---- AES-256-GCM (low-level) --------------------------------------------
export { aesGcmEncrypt, aesGcmDecrypt } from './aes-gcm.js';

// ---- PBKDF2 key derivation ----------------------------------------------
export { generateSalt, generateSaltBase64Url, deriveVaultKey } from './pbkdf2.js';

// ---- BIP-39 mnemonic ----------------------------------------------------
export { generateMnemonic, validateMnemonic, mnemonicToSeed } from './mnemonic.js';

// ---- Vault (high-level encrypted storage) -------------------------------
export type { CexCredentialPlaintext } from './vault.js';
export {
  createVault,
  decryptVaultMnemonic,
  addAccountToVault,
  decryptAccountKey,
  removeAccountFromVault,
  addCexCredentialToVault,
  decryptCexCredential,
  removeCexCredentialFromVault,
  changeVaultPassword,
} from './vault.js';

// ---- EVM (secp256k1 / BIP-44) -------------------------------------------
export type { EvmAccount } from './derive-evm.js';
export {
  buildEvmDerivationPath,
  deriveEvmAccount,
  privateKeyToEvmAddress,
  signEvmPersonalMessage,
  signEvmDigest,
} from './derive-evm.js';

// ---- Solana (ed25519 / SLIP-0010) ----------------------------------------
export type { SolanaAccount } from './derive-svm.js';
export {
  buildSolanaDerivationPath,
  deriveSolanaAccount,
  deriveSolanaPublicKey,
  signSolanaMessage,
  decodeSolanaSignature,
} from './derive-svm.js';

// ---- Bitcoin (secp256k1 / BIP-84 / P2WPKH) ------------------------------
export type { BitcoinAccount } from './derive-utxo.js';
export {
  buildBitcoinDerivationPath,
  deriveBitcoinAccount,
  compressedPubKeyToP2wpkhAddress,
  decodeWif,
} from './derive-utxo.js';

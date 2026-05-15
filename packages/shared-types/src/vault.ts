import type { AccountId } from './wallet.js';
import type { ChainId } from './chains.js';

// AES-256-GCM ciphertext envelope — all fields are base64url strings.
export interface AesGcmPayload {
  iv: string;          // 12-byte nonce
  ciphertext: string;  // encrypted data
  authTag: string;     // 16-byte GCM authentication tag
}

export const VAULT_VERSION = 1 as const;
export type VaultVersion = typeof VAULT_VERSION;

export interface EncryptedVault {
  version: VaultVersion;
  // PBKDF2 salt — 16 bytes, base64url. Unique per vault creation.
  salt: string;
  // Encrypted BIP-39 mnemonic for the primary HD wallet.
  mnemonic: AesGcmPayload;
  // Per-account encrypted private key material, keyed by AccountId.
  accounts: Record<AccountId, AesGcmPayload>;
  // Encrypted CEX credentials, keyed by credential UUID.
  // Each payload decrypts to JSON: { apiKey: string; secret: string; passphrase?: string }.
  cexCredentials: Record<string, AesGcmPayload>;
}

export interface VaultState {
  hasVault: boolean;
  isLocked: boolean;
  activeAccountId: AccountId | null;
  activeChainId: ChainId | null;
  // Auto-lock timeout in milliseconds. 0 means never auto-lock.
  autoLockMs: number;
}

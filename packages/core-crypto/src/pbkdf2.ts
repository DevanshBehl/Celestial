import { fromBase64Url, randomBytes, toBase64Url, utf8ToBytes } from './utils.js';

// OWASP 2023 recommends 600,000 iterations for PBKDF2-HMAC-SHA256.
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16; // 128-bit salt — OWASP minimum
const KEY_BITS = 256;  // AES-256

export function generateSalt(): Uint8Array<ArrayBuffer> {
  return randomBytes(SALT_BYTES);
}

export function generateSaltBase64Url(): string {
  return toBase64Url(generateSalt());
}

// Derives a non-extractable AES-GCM CryptoKey from a user password and a vault salt.
// The salt must be unique per vault creation; rotate it on password change.
export async function deriveVaultKey(
  password: string,
  salt: string | Uint8Array,
): Promise<CryptoKey> {
  // utf8ToBytes and fromBase64Url both return Uint8Array<ArrayBuffer>,
  // satisfying the Web Crypto BufferSource requirement in TypeScript 5.9+.
  const passwordBytes = utf8ToBytes(password);
  const saltBytes = typeof salt === 'string' ? fromBase64Url(salt) : salt.slice();

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,      // non-extractable — the raw key bytes never leave the crypto module
    ['encrypt', 'decrypt'],
  );
}

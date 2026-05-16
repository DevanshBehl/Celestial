import type { AesGcmPayload } from '@celestial/shared-types';
import { fromBase64Url, randomBytes, toBase64Url } from './utils.js';

const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const GCM_TAG_BITS = GCM_TAG_BYTES * 8; // 128

// Web Crypto AES-256-GCM encrypt. The returned payload is safe to persist.
export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<AesGcmPayload> {
  const iv = randomBytes(GCM_IV_BYTES); // Uint8Array<ArrayBuffer>

  // .slice() produces Uint8Array<ArrayBuffer> even when the input is Uint8Array<ArrayBufferLike>,
  // satisfying the Web Crypto BufferSource constraint in TypeScript 5.9+.
  const ciphertextWithTag = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS },
      key,
      plaintext.slice(),
    ),
  );

  // Web Crypto appends the 16-byte GCM auth tag at the end of the ciphertext output.
  const ciphertext = ciphertextWithTag.slice(0, ciphertextWithTag.length - GCM_TAG_BYTES);
  const authTag = ciphertextWithTag.slice(ciphertextWithTag.length - GCM_TAG_BYTES);

  return {
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(ciphertext),
    authTag: toBase64Url(authTag),
  };
}

// Web Crypto AES-256-GCM decrypt. Throws (DOMException) if the auth tag validation fails.
export async function aesGcmDecrypt(
  key: CryptoKey,
  payload: AesGcmPayload,
): Promise<Uint8Array<ArrayBuffer>> {
  // fromBase64Url returns Uint8Array<ArrayBuffer> — safe to pass directly to Web Crypto.
  const iv = fromBase64Url(payload.iv);
  const ciphertext = fromBase64Url(payload.ciphertext);
  const authTag = fromBase64Url(payload.authTag);

  // Re-assemble ciphertext||authTag: Web Crypto AES-GCM expects them concatenated.
  const ciphertextWithTag = new Uint8Array(ciphertext.length + GCM_TAG_BYTES);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(authTag, ciphertext.length);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS },
    key,
    ciphertextWithTag,
  );
  return new Uint8Array(plaintext);
}

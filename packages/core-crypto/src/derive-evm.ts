import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { fromHex, toHex } from './utils.js';

// BIP-44: m/44'/60'/0'/0/index — Ethereum coin type 60
export function buildEvmDerivationPath(accountIndex: number): string {
  return `m/44'/60'/0'/0/${accountIndex}`;
}

export interface EvmAccount {
  // 0x-prefixed 32-byte private key hex. Treat as maximally sensitive.
  privateKeyHex: string;
  // EIP-55 checksum address.
  address: string;
  derivationPath: string;
}

// Derives a secp256k1 EVM account from a 64-byte BIP-39 seed.
export function deriveEvmAccount(seed: Uint8Array, derivationPath: string): EvmAccount {
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive(derivationPath);
  if (!child.privateKey) throw new Error('EVM key derivation produced no private key');
  const privateKeyHex = '0x' + toHex(child.privateKey);
  const address = privateKeyToEvmAddress(child.privateKey);
  return { privateKeyHex, address, derivationPath };
}

// Derives an EIP-55 checksum address from a 32-byte private key.
export function privateKeyToEvmAddress(privateKey: Uint8Array | string): string {
  const keyBytes = typeof privateKey === 'string' ? fromHex(privateKey) : privateKey;
  // Uncompressed public key: 04 || x(32) || y(32)
  const uncompressed = secp256k1.getPublicKey(keyBytes, false);
  // Hash the 64-byte x||y portion (skip the 04 prefix byte)
  const hash = keccak_256(uncompressed.slice(1));
  // EVM address = last 20 bytes of that hash
  const addressBytes = hash.slice(12);
  return toChecksumAddress(toHex(addressBytes));
}

// EIP-55: uppercase a hex digit when the corresponding nibble of keccak256(lower_address) >= 8.
function toChecksumAddress(addressHex: string): string {
  const lower = addressHex.toLowerCase();
  const hash = toHex(keccak_256(new TextEncoder().encode(lower)));
  let result = '0x';
  for (let i = 0; i < lower.length; i++) {
    result += parseInt(hash[i]!, 16) >= 8 ? lower[i]!.toUpperCase() : lower[i]!;
  }
  return result;
}

// EIP-191 personal_sign: keccak256("\x19Ethereum Signed Message:\n" + len + message)
// Returns a 65-byte "0x"-prefixed hex signature: r(32) || s(32) || v(1).
export function signEvmPersonalMessage(
  privateKeyHex: string,
  message: string | Uint8Array,
): string {
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const prefix = new TextEncoder().encode(
    `\x19Ethereum Signed Message:\n${msgBytes.length}`,
  );
  const combined = new Uint8Array(prefix.length + msgBytes.length);
  combined.set(prefix);
  combined.set(msgBytes, prefix.length);
  const digest = keccak_256(combined);
  return signEvmDigest(privateKeyHex, digest);
}

// Signs a raw 32-byte keccak256 digest (for typed data hashing or raw tx signing).
// Returns a 65-byte "0x"-prefixed hex signature: r(32) || s(32) || v(1).
// v follows EIP-191/legacy convention: recovery_id + 27.
export function signEvmDigest(privateKeyHex: string, digest: Uint8Array): string {
  const privKey = fromHex(privateKeyHex);
  const sig = secp256k1.sign(digest, privKey, { lowS: true });
  const r = sig.r.toString(16).padStart(64, '0');
  const s = sig.s.toString(16).padStart(64, '0');
  const v = (sig.recovery! + 27).toString(16).padStart(2, '0');
  return '0x' + r + s + v;
}

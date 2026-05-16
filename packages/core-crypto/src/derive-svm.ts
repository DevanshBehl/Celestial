import { ed25519 } from '@noble/curves/ed25519';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { base58 } from '@scure/base';
import { fromBase64, toBase64 } from './utils.js';

// SLIP-0010 path for Solana (coin type 501, matching Phantom/Solflare):
// m/44'/501'/accountIndex'/0'  — all segments are hardened.
export function buildSolanaDerivationPath(accountIndex: number): string {
  return `m/44'/501'/${accountIndex}'/0'`;
}

export interface SolanaAccount {
  // Solana 64-byte keypair (seed || publicKey) encoded as base58.
  // Matches the format exported by Phantom and accepted by @solana/web3.js Keypair.fromSecretKey.
  privateKeyHex: string;
  // Base58-encoded 32-byte Ed25519 public key (the on-chain address).
  address: string;
  derivationPath: string;
}

// ---- SLIP-0010 ed25519 key derivation -----------------------------------
// ed25519 in SLIP-0010 only supports hardened children; all path segments must be hardened.

interface Slip10Node {
  key: Uint8Array;       // 32-byte private key
  chainCode: Uint8Array; // 32-byte chain code
}

function slip10MasterKey(seed: Uint8Array): Slip10Node {
  const I = hmac(sha512, new TextEncoder().encode('ed25519 seed'), seed);
  return { key: I.slice(0, 32), chainCode: I.slice(32) };
}

function slip10HardenedChild(parent: Slip10Node, index: number): Slip10Node {
  // index must already have the hardened bit set (>= 0x80000000)
  const indexBuf = new Uint8Array(4);
  new DataView(indexBuf.buffer).setUint32(0, index >>> 0, false); // big-endian
  // data = 0x00 || parent.key || index_BE
  const data = new Uint8Array(37);
  data[0] = 0x00;
  data.set(parent.key, 1);
  data.set(indexBuf, 33);
  const I = hmac(sha512, parent.chainCode, data);
  return { key: I.slice(0, 32), chainCode: I.slice(32) };
}

function parsePathSegments(path: string): number[] {
  const clean = path.startsWith('m/') ? path.slice(2) : path;
  return clean.split('/').map(segment => {
    const hardened = segment.endsWith("'");
    const idx = parseInt(hardened ? segment.slice(0, -1) : segment, 10);
    if (isNaN(idx) || idx < 0) throw new Error(`Invalid BIP-32 path segment: "${segment}"`);
    if (!hardened) {
      // SLIP-0010 ed25519 only supports hardened derivation
      throw new Error(`Non-hardened derivation is not supported for ed25519. Segment: "${segment}"`);
    }
    return (idx | 0x80000000) >>> 0;
  });
}

function slip10Derive(
  seed: Uint8Array,
  path: string,
): { privateKey: Uint8Array; publicKey: Uint8Array } {
  let node = slip10MasterKey(seed);
  for (const index of parsePathSegments(path)) {
    node = slip10HardenedChild(node, index);
  }
  const publicKey = ed25519.getPublicKey(node.key);
  return { privateKey: node.key, publicKey };
}

// ---- Public API ----------------------------------------------------------

// Derives a Solana keypair from a BIP-39 seed using SLIP-0010 ed25519.
export function deriveSolanaAccount(seed: Uint8Array, derivationPath: string): SolanaAccount {
  const { privateKey, publicKey } = slip10Derive(seed, derivationPath);

  // 64-byte keypair: privateKey(32) || publicKey(32) — Solana/Phantom convention.
  const keypairBytes = new Uint8Array(64);
  keypairBytes.set(privateKey);
  keypairBytes.set(publicKey, 32);

  return {
    privateKeyHex: base58.encode(keypairBytes),
    address: base58.encode(publicKey),
    derivationPath,
  };
}

// Recovers the 32-byte Ed25519 public key from a base58-encoded Solana keypair string.
export function deriveSolanaPublicKey(privateKeyBase58: string): string {
  const keypairBytes = base58.decode(privateKeyBase58);
  if (keypairBytes.length === 64) {
    // Already a full keypair — return the embedded public key.
    return base58.encode(keypairBytes.slice(32));
  }
  // 32-byte raw private key — derive the public key.
  return base58.encode(ed25519.getPublicKey(keypairBytes.slice(0, 32)));
}

// Signs arbitrary message bytes with ed25519. Returns a base64-encoded 64-byte signature.
export function signSolanaMessage(
  privateKeyBase58: string,
  message: Uint8Array,
): string {
  const keypairBytes = base58.decode(privateKeyBase58);
  // The ed25519 signing key is always the first 32 bytes.
  const privateKey = keypairBytes.slice(0, 32);
  const signature = ed25519.sign(message, privateKey);
  return toBase64(signature);
}

// Decodes a base64 Solana signature back to a Uint8Array (useful for injecting into a tx).
export function decodeSolanaSignature(signatureBase64: string): Uint8Array {
  return fromBase64(signatureBase64);
}

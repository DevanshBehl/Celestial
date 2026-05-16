import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { base58, bech32 } from '@scure/base';
import { toHex } from './utils.js';

// BIP-84 (native SegWit P2WPKH): m/84'/coinType'/accountIndex'/0/0
// coin_type = 0 for mainnet, 1 for testnet.
export function buildBitcoinDerivationPath(
  accountIndex: number,
  isTestnet = false,
): string {
  const coinType = isTestnet ? 1 : 0;
  return `m/84'/${coinType}'/${accountIndex}'/0/0`;
}

export interface BitcoinAccount {
  // WIF-encoded compressed private key (mainnet prefix 0x80, testnet 0xEF).
  privateKeyHex: string;
  // Bech32 P2WPKH address ("bc1..." mainnet, "tb1..." testnet).
  address: string;
  derivationPath: string;
}

// Derives a BIP-84 P2WPKH Bitcoin account from a 64-byte BIP-39 seed.
export function deriveBitcoinAccount(
  seed: Uint8Array,
  derivationPath: string,
  isTestnet = false,
): BitcoinAccount {
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive(derivationPath);

  if (!child.privateKey || !child.publicKey) {
    throw new Error('Bitcoin key derivation produced no private key');
  }

  // @scure/bip32 always gives a compressed 33-byte public key.
  const compressedPubKey = child.publicKey;

  // P2WPKH witness program = RIPEMD160(SHA256(compressed_pubkey))
  const pubKeyHash = ripemd160(sha256(compressedPubKey));

  // bech32 address: [witnessVersion=0, ...toWords(pubKeyHash)]
  const words = bech32.toWords(pubKeyHash);
  const witnessProgram = new Uint8Array(1 + words.length);
  witnessProgram[0] = 0x00; // witness version 0
  witnessProgram.set(words, 1);
  const hrp = isTestnet ? 'tb' : 'bc';
  const address = bech32.encode(hrp, witnessProgram);

  const wif = encodeWif(child.privateKey, isTestnet);
  return { privateKeyHex: wif, address, derivationPath };
}

// Recovers the bech32 P2WPKH address from a compressed 33-byte public key.
export function compressedPubKeyToP2wpkhAddress(
  compressedPubKey: Uint8Array,
  isTestnet = false,
): string {
  const pubKeyHash = ripemd160(sha256(compressedPubKey));
  const words = bech32.toWords(pubKeyHash);
  const witnessProgram = new Uint8Array(1 + words.length);
  witnessProgram[0] = 0x00;
  witnessProgram.set(words, 1);
  return bech32.encode(isTestnet ? 'tb' : 'bc', witnessProgram);
}

// WIF (Wallet Import Format) for a compressed private key.
// Format: version(1) || privateKey(32) || compressionFlag(1) || checksum(4)
function encodeWif(privateKey: Uint8Array, isTestnet: boolean): string {
  const version = isTestnet ? 0xef : 0x80;
  const payload = new Uint8Array(34);
  payload[0] = version;
  payload.set(privateKey, 1);
  payload[33] = 0x01; // indicates compressed public key

  const checksum = sha256(sha256(payload)).slice(0, 4);
  const final = new Uint8Array(38);
  final.set(payload);
  final.set(checksum, 34);

  return base58.encode(final);
}

// Decodes a WIF string back to a raw 32-byte private key.
// Useful when the extension needs to reconstruct a signer from vault material.
export function decodeWif(wif: string): { privateKey: Uint8Array; isTestnet: boolean } {
  const raw = base58.decode(wif);
  if (raw.length !== 38 && raw.length !== 37) {
    throw new Error('Invalid WIF length');
  }

  const version = raw[0]!;
  const isTestnet = version === 0xef;
  if (version !== 0x80 && version !== 0xef) {
    throw new Error(`Unknown WIF version byte: 0x${toHex(new Uint8Array([version]))}`);
  }

  // Verify checksum.
  const payload = raw.slice(0, 34);
  const storedChecksum = raw.slice(34);
  const expectedChecksum = sha256(sha256(payload)).slice(0, 4);
  for (let i = 0; i < 4; i++) {
    if (storedChecksum[i] !== expectedChecksum[i]) {
      throw new Error('WIF checksum mismatch — key may be corrupted');
    }
  }

  return { privateKey: payload.slice(1, 33), isTestnet };
}

import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

// 128 bits of entropy = 12 words; 256 bits = 24 words.
export function generateMnemonic(strength: 128 | 256 = 128): string {
  return bip39.generateMnemonic(wordlist, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}

// BIP-39 PBKDF2-SHA512 seed (64 bytes). Optional passphrase is the BIP-39 extension word,
// distinct from the vault encryption password.
export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Uint8Array> {
  return bip39.mnemonicToSeed(mnemonic, passphrase);
}

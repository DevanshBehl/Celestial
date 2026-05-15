import type { ChainFamily, ChainId } from './chains.js';

export type WalletId  = string;  // UUID v4
export type AccountId = string;  // UUID v4

export enum DerivationStandard {
  BIP44 = 'bip44',  // m/44'/coin_type'/account'/change/index  — EVM default
  BIP84 = 'bip84',  // m/84'/0'/account'/change/index          — native segwit BTC
  SVM   = 'svm',    // m/44'/501'/account'/0'                  — Solana
}

export interface HDWalletMeta {
  id: WalletId;
  name: string;
  createdAt: number;   // Unix timestamp ms
}

export interface Account {
  id: AccountId;
  walletId: WalletId;
  name: string;
  address: string;         // checksum EVM | base58 Solana | bech32 BTC
  chainFamily: ChainFamily;
  chainId: ChainId;
  derivationPath: string;  // full BIP32 path, e.g. "m/44'/60'/0'/0/0"
  index: number;           // account index within this wallet
}

// Held in memory only while the vault is unlocked — never persisted.
// Cleared immediately when the vault is locked or the service worker terminates.
export interface KeyringAccount extends Account {
  privateKeyHex: string;  // 0x-prefixed hex (EVM) | base58 (Solana) | WIF (BTC)
}

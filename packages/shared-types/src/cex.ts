import type { AesGcmPayload } from './vault.js';

export enum ExchangeId {
  BINANCE  = 'binance',
  COINBASE = 'coinbase',
  KRAKEN   = 'kraken',
  OKX      = 'okx',
  BYBIT    = 'bybit',
}

export enum CexPermission {
  READ     = 'read',
  TRADE    = 'trade',
  WITHDRAW = 'withdraw',
}

// Full credential record — stored encrypted in the vault.
export interface CexCredentials {
  id: string;
  exchangeId: ExchangeId;
  label: string;
  // Decrypts to JSON: { apiKey: string; secret: string; passphrase?: string }
  encryptedPayload: AesGcmPayload;
  createdAt: number;
  lastUsedAt?: number;
  permissions: CexPermission[];
}

// Public-facing metadata — safe to expose to the popup without decrypting.
export interface CexCredentialsMeta {
  id: string;
  exchangeId: ExchangeId;
  label: string;
  createdAt: number;
  lastUsedAt?: number;
  permissions: CexPermission[];
}

export enum CexOrderSide {
  BUY  = 'buy',
  SELL = 'sell',
}

export enum CexOrderType {
  MARKET       = 'market',
  LIMIT        = 'limit',
  STOP_LIMIT   = 'stop_limit',
  STOP_MARKET  = 'stop_market',
}

export enum CexOrderStatus {
  OPEN             = 'open',
  FILLED           = 'filled',
  CANCELLED        = 'cancelled',
  PARTIALLY_FILLED = 'partially_filled',
  REJECTED         = 'rejected',
  EXPIRED          = 'expired',
}

export interface CexOrder {
  id: string;
  clientOrderId?: string;
  exchangeId: ExchangeId;
  credentialId: string;
  symbol: string;              // e.g. "BTC/USDT"
  side: CexOrderSide;
  type: CexOrderType;
  status: CexOrderStatus;
  price?: string;              // decimal string; absent for market orders
  stopPrice?: string;
  quantity: string;            // base asset, decimal string
  filledQuantity: string;
  averageFillPrice?: string;
  fee?: string;
  feeAsset?: string;
  createdAt: number;           // Unix ms
  updatedAt: number;
}

export interface CexOrderBookEntry {
  price: string;
  quantity: string;
}

export interface CexOrderBook {
  symbol: string;
  exchangeId: ExchangeId;
  bids: CexOrderBookEntry[];   // highest to lowest
  asks: CexOrderBookEntry[];   // lowest to highest
  timestamp: number;
}

export interface CexTicker {
  symbol: string;
  exchangeId: ExchangeId;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  volume24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
}

export interface CexAssetBalance {
  asset: string;               // e.g. "BTC", "USDT"
  free: string;
  locked: string;
  total: string;
  usdValue?: number;
}

export interface CexPortfolio {
  exchangeId: ExchangeId;
  credentialId: string;
  balances: CexAssetBalance[];
  totalUsdValue?: number;
  fetchedAt: number;
}

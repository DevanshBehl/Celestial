import type { ChainId } from './chains.js';
import type { AccountId } from './wallet.js';

export interface TokenMetadata {
  address: string;           // contract addr (EVM) | mint addr (SVM) | 'native'
  symbol: string;
  name: string;
  decimals: number;
  chainId: ChainId;
  logoURI?: string;
  coingeckoId?: string;
  isVerified: boolean;
  isSpam: boolean;
}

export interface TokenBalance {
  token: TokenMetadata;
  rawBalance: string;        // BigInt serialized as decimal string
  formattedBalance: string;  // human-readable, chain-decimal-adjusted
  usdPrice?: number;
  usdValue?: number;
}

export interface NativeBalance {
  chainId: ChainId;
  rawBalance: string;
  formattedBalance: string;
  usdPrice?: number;
  usdValue?: number;
}

export interface PortfolioSnapshot {
  accountId: AccountId;
  totalUsdValue: number;
  change24hPercent?: number;
  nativeBalances: NativeBalance[];
  tokenBalances: TokenBalance[];
  lastUpdatedAt: number;     // Unix ms
}

export interface SwapQuote {
  fromToken: TokenMetadata;
  toToken: TokenMetadata;
  fromAmount: string;        // human units, decimal string
  toAmount: string;          // expected output, human units
  toAmountMin: string;       // minimum output after slippage
  slippageBps: number;       // basis points, e.g. 50 = 0.5%
  priceImpactPercent: number;
  route: string[];           // intermediate token addresses
  aggregator: string;        // e.g. "1inch" | "jupiter"
  expiresAt: number;         // Unix ms
  // Execution data — present when quote is ready to submit
  calldata?: string;         // hex-encoded (EVM) or base64 (SVM)
  value?: string;            // native token amount to send with tx (EVM), hex wei
}

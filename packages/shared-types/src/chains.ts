export enum ChainId {
  // EVM — mainnet
  ETHEREUM         = 1,
  OPTIMISM         = 10,
  BSC              = 56,
  POLYGON          = 137,
  ZKSYNC           = 324,
  BASE             = 8453,
  ARBITRUM         = 42161,
  AVALANCHE        = 43114,
  LINEA            = 59144,
  SCROLL           = 534352,

  // EVM — testnet
  SEPOLIA          = 11155111,
  OP_SEPOLIA       = 11155420,
  BASE_SEPOLIA     = 84532,
  ARBITRUM_SEPOLIA = 421614,
  BSC_TESTNET      = 97,

  // Non-EVM (synthetic IDs — must never collide with real EVM chain IDs)
  SOLANA           = 900_000_001,
  BITCOIN          = 900_000_002,
  BITCOIN_TESTNET  = 900_000_003,
}

export enum ChainFamily {
  EVM  = 'evm',
  SVM  = 'svm',   // Solana Virtual Machine
  UTXO = 'utxo',  // Bitcoin-family
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  chainId: ChainId;
  name: string;
  shortName: string;
  family: ChainFamily;
  rpcUrls: readonly string[];
  fallbackRpcUrls?: readonly string[];
  blockExplorerUrl: string;
  nativeCurrency: NativeCurrency;
  isTestnet: boolean;
  iconUrl?: string;
  coingeckoChainId?: string;  // slug used for price lookups
}

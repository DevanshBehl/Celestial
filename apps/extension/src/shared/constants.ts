import type { NetworkConfig, WalletSettings } from '@celestial/shared-types';
import {
  ChainFamily,
  ChainId,
  Currency,
  Language,
} from '@celestial/shared-types';

export const AUTO_LOCK_ALARM = 'celestial/autolock';

// ---- Built-in networks ---------------------------------------------------

export const BUILTIN_NETWORKS: NetworkConfig[] = [
  {
    chainId: ChainId.ETHEREUM,
    name: 'Ethereum',
    shortName: 'ETH',
    family: ChainFamily.EVM,
    rpcUrls: ['https://eth.llamarpc.com', 'https://cloudflare-eth.com'],
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    coingeckoChainId: 'ethereum',
  },
  {
    chainId: ChainId.BASE,
    name: 'Base',
    shortName: 'BASE',
    family: ChainFamily.EVM,
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    coingeckoChainId: 'base',
  },
  {
    chainId: ChainId.ARBITRUM,
    name: 'Arbitrum One',
    shortName: 'ARB',
    family: ChainFamily.EVM,
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    coingeckoChainId: 'arbitrum-one',
  },
  {
    chainId: ChainId.OPTIMISM,
    name: 'Optimism',
    shortName: 'OP',
    family: ChainFamily.EVM,
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    coingeckoChainId: 'optimistic-ethereum',
  },
  {
    chainId: ChainId.POLYGON,
    name: 'Polygon',
    shortName: 'MATIC',
    family: ChainFamily.EVM,
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    isTestnet: false,
    coingeckoChainId: 'polygon-pos',
  },
  {
    chainId: ChainId.BSC,
    name: 'BNB Smart Chain',
    shortName: 'BNB',
    family: ChainFamily.EVM,
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrl: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    isTestnet: false,
    coingeckoChainId: 'binance-smart-chain',
  },
  {
    chainId: ChainId.SOLANA,
    name: 'Solana',
    shortName: 'SOL',
    family: ChainFamily.SVM,
    rpcUrls: ['https://api.mainnet-beta.solana.com'],
    blockExplorerUrl: 'https://solscan.io',
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
    isTestnet: false,
    coingeckoChainId: 'solana',
  },
  {
    chainId: ChainId.SEPOLIA,
    name: 'Sepolia',
    shortName: 'SEP',
    family: ChainFamily.EVM,
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
  },
];

export const NETWORK_BY_CHAIN_ID: ReadonlyMap<ChainId, NetworkConfig> = new Map(
  BUILTIN_NETWORKS.map(n => [n.chainId, n]),
);

// ---- Default wallet settings ---------------------------------------------

export const DEFAULT_SETTINGS: WalletSettings = {
  currency: Currency.USD,
  language: Language.EN,
  autoLockMs: 5 * 60 * 1_000,   // 5 minutes
  hideSmallBalances: true,
  slippageBps: 50,               // 0.5 %
  maxPriorityFeeMultiplier: 1.0,
  analyticsEnabled: false,
  testnetVisible: false,
  defaultChainId: ChainId.ETHEREUM,
  customRpcUrls: {},
};

import type { ChainId } from './chains.js';
import type { AccountId } from './wallet.js';
import type { VaultState } from './vault.js';
import type { PortfolioSnapshot } from './token.js';

export enum AppView {
  ONBOARDING      = 'onboarding',
  CREATE_WALLET   = 'create_wallet',
  IMPORT_WALLET   = 'import_wallet',
  UNLOCK          = 'unlock',
  DASHBOARD       = 'dashboard',
  SEND            = 'send',
  RECEIVE         = 'receive',
  SWAP            = 'swap',
  ACTIVITY        = 'activity',
  TOKEN_DETAIL    = 'token_detail',
  SETTINGS        = 'settings',
  SECURITY        = 'security',
  NETWORKS        = 'networks',
  CONNECTED_SITES = 'connected_sites',
  CEX_ACCOUNTS    = 'cex_accounts',
  SIGN_REQUEST    = 'sign_request',    // dApp signature prompt
  TX_CONFIRM      = 'tx_confirm',      // user-initiated tx confirmation
  TX_PENDING      = 'tx_pending',
  TX_RESULT       = 'tx_result',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
  KRW = 'KRW',
  BTC = 'BTC',
  ETH = 'ETH',
}

export enum Language {
  EN = 'en',
  ZH = 'zh',
  ES = 'es',
  FR = 'fr',
  JA = 'ja',
  KO = 'ko',
}

export interface WalletSettings {
  currency: Currency;
  language: Language;
  autoLockMs: number;                               // 0 = never
  hideSmallBalances: boolean;                       // hide tokens with < $1 USD value
  slippageBps: number;                              // default swap slippage, basis points
  maxPriorityFeeMultiplier: number;                 // EVM tip scaling factor (1.0 = base)
  analyticsEnabled: boolean;
  testnetVisible: boolean;
  defaultChainId: ChainId;
  customRpcUrls: Partial<Record<ChainId, string>>;  // user-overridden RPC URLs per chain
}

export interface PopupState {
  vault: VaultState;
  view: AppView;
  previousView: AppView | null;
  portfolio: PortfolioSnapshot | null;
  settings: WalletSettings;
  connectedDApps: ConnectedDApp[];
  pendingDAppRequest: DAppRequest | null;
  toasts: ToastNotification[];
  modal: ModalConfig | null;
  // false until the background service worker has responded to POPUP_INIT
  isBootstrapped: boolean;
}

export enum DAppPermission {
  READ_ACCOUNTS   = 'eth_accounts',
  SIGN_MESSAGE    = 'personal_sign',
  SIGN_TYPED_DATA = 'eth_signTypedData',
  SEND_TX         = 'eth_sendTransaction',
}

export interface ConnectedDApp {
  origin: string;               // e.g. "https://app.uniswap.org"
  name: string;
  favicon?: string;
  connectedAt: number;          // Unix ms
  accounts: AccountId[];
  chainId: ChainId;
  permissions: DAppPermission[];
}

// An inbound JSON-RPC request from a dApp (via content script → background).
// Held in background state and synced to popup when user action is required.
export interface DAppRequest {
  id: string;                   // correlates with ExtensionMessage.requestId
  origin: string;
  method: string;
  params: unknown[];
  favicon?: string;
  receivedAt: number;           // Unix ms
}

export enum ToastType {
  SUCCESS = 'success',
  ERROR   = 'error',
  INFO    = 'info',
  WARNING = 'warning',
}

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;          // undefined = sticky until dismissed
  actionLabel?: string;
  actionView?: AppView;
}

export enum ModalType {
  CONFIRM_TX       = 'confirm_tx',
  CONFIRM_DELETE   = 'confirm_delete',
  REVEAL_PHRASE    = 'reveal_phrase',
  REVEAL_KEY       = 'reveal_key',
  ADD_NETWORK      = 'add_network',
  IMPORT_TOKEN     = 'import_token',
  ADD_CEX_ACCOUNT  = 'add_cex_account',
}

export interface ModalConfig {
  type: ModalType;
  props?: Record<string, unknown>;
}

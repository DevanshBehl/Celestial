import type { CelestialErrorCode } from './errors.js';
import type { ChainId, NetworkConfig } from './chains.js';
import type { Account, AccountId, WalletId } from './wallet.js';
import type { VaultState } from './vault.js';
import type {
  BaseTxRecord,
  EvmGasFeeEstimate,
  EvmTransactionRequest,
  SolanaFeeEstimate,
  SolanaTransactionRequest,
} from './transaction.js';
import type { PortfolioSnapshot, SwapQuote } from './token.js';
import type { ConnectedDApp, DAppRequest, PopupState, WalletSettings } from './ui.js';
import type { CexCredentialsMeta, CexPermission, ExchangeId } from './cex.js';

export enum MessageTarget {
  BACKGROUND     = 'background',
  POPUP          = 'popup',
  CONTENT_SCRIPT = 'content_script',
}

export enum MessageType {
  // Vault lifecycle
  VAULT_UNLOCK          = 'vault/unlock',
  VAULT_LOCK            = 'vault/lock',
  VAULT_CREATE          = 'vault/create',
  VAULT_IMPORT          = 'vault/import',
  VAULT_EXPORT_MNEMONIC = 'vault/export_mnemonic',
  VAULT_CHANGE_PASSWORD = 'vault/change_password',
  VAULT_STATE_GET       = 'vault/state/get',
  // bg → popup push: background has new vault state (e.g. auto-lock fired)
  VAULT_STATE_SYNC      = 'vault/state/sync',

  // Account management
  ACCOUNT_CREATE        = 'account/create',
  ACCOUNT_RENAME        = 'account/rename',
  ACCOUNT_LIST          = 'account/list',
  ACCOUNT_SWITCH        = 'account/switch',
  ACCOUNT_REMOVE        = 'account/remove',
  ACCOUNT_EXPORT_KEY    = 'account/export_key',

  // Network
  NETWORK_SWITCH        = 'network/switch',
  NETWORK_LIST          = 'network/list',
  NETWORK_ADD_CUSTOM    = 'network/add_custom',
  NETWORK_REMOVE_CUSTOM = 'network/remove_custom',

  // Portfolio & balances
  PORTFOLIO_GET         = 'portfolio/get',
  PORTFOLIO_REFRESH     = 'portfolio/refresh',
  // bg → popup push: background fetched fresh balances
  PORTFOLIO_SYNC        = 'portfolio/sync',

  // Transactions
  TX_SIGN               = 'tx/sign',
  TX_SEND               = 'tx/send',
  TX_SIMULATE           = 'tx/simulate',
  TX_HISTORY_GET        = 'tx/history/get',
  TX_CANCEL             = 'tx/cancel',
  TX_SPEED_UP           = 'tx/speed_up',
  // bg → popup push: monitored tx changed status
  TX_STATUS_SYNC        = 'tx/status/sync',

  // Gas estimation
  GAS_ESTIMATE_GET      = 'gas/estimate/get',

  // Swap
  SWAP_QUOTE_GET        = 'swap/quote/get',
  SWAP_EXECUTE          = 'swap/execute',

  // dApp integration — popup ↔ background routing inbound content-script RPC
  DAPP_CONNECT          = 'dapp/connect',
  DAPP_DISCONNECT       = 'dapp/disconnect',
  DAPP_APPROVE          = 'dapp/approve',
  DAPP_REJECT           = 'dapp/reject',
  DAPP_SIGN_MESSAGE     = 'dapp/sign/message',
  DAPP_SIGN_TYPED_DATA  = 'dapp/sign/typed_data',
  DAPP_SIGN_TX          = 'dapp/sign/tx',
  DAPP_SEND_TX          = 'dapp/send/tx',
  DAPP_LIST_CONNECTED   = 'dapp/list_connected',
  DAPP_REVOKE           = 'dapp/revoke',
  // bg → popup push: a dApp action requires user approval
  DAPP_REQUEST_SYNC     = 'dapp/request/sync',

  // Settings
  SETTINGS_GET          = 'settings/get',
  SETTINGS_UPDATE       = 'settings/update',
  SETTINGS_RESET        = 'settings/reset',

  // CEX credentials (encrypted/stored in vault by background SW)
  CEX_CREDENTIAL_SAVE     = 'cex/credential/save',
  CEX_CREDENTIAL_LIST     = 'cex/credential/list',
  CEX_CREDENTIAL_DELETE   = 'cex/credential/delete',
  CEX_CREDENTIAL_VALIDATE = 'cex/credential/validate',

  // Bootstrap — popup sends on open; background returns full hydrated PopupState
  POPUP_INIT            = 'popup/init',
}

// ---- Core envelope -------------------------------------------------------

export interface ExtensionMessage<TPayload = unknown> {
  type: MessageType;
  target: MessageTarget;
  payload: TPayload;
  requestId: string;   // UUID — used to correlate async responses
  origin?: string;     // set for messages sourced from a content script
}

export interface ExtensionResponse<TData = unknown> {
  requestId: string;
  success: true;
  data: TData;
}

export interface ExtensionErrorResponse {
  requestId: string;
  success: false;
  error: {
    code: CelestialErrorCode;
    message: string;
    context?: Record<string, unknown>;
  };
}

export type AnyExtensionResponse<T = unknown> =
  | ExtensionResponse<T>
  | ExtensionErrorResponse;

// ---- Request payload types -----------------------------------------------

export interface UnlockVaultPayload {
  password: string;
}

export interface CreateVaultPayload {
  mnemonic: string;
  password: string;
  walletName: string;
}

export interface ImportVaultPayload {
  mnemonic: string;
  password: string;
  walletName: string;
}

export interface ExportMnemonicPayload {
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAccountPayload {
  walletId: WalletId;
  name: string;
  chainId: ChainId;
  password: string;
}

export interface RenameAccountPayload {
  accountId: AccountId;
  name: string;
}

export interface SwitchAccountPayload {
  accountId: AccountId;
}

export interface ExportKeyPayload {
  accountId: AccountId;
  password: string;   // vault password re-confirmation — prevents shoulder-surfing attacks
}

export interface SwitchNetworkPayload {
  chainId: ChainId;
}

export interface AddCustomNetworkPayload {
  config: NetworkConfig;
}

export interface RemoveCustomNetworkPayload {
  chainId: ChainId;
}

export interface GetPortfolioPayload {
  accountId: AccountId;
  forceRefresh?: boolean;
}

export interface SignTxPayload {
  accountId: AccountId;
  tx: EvmTransactionRequest | SolanaTransactionRequest;
}

export interface SendTxPayload {
  accountId: AccountId;
  tx: EvmTransactionRequest | SolanaTransactionRequest;
}

export interface SimulateTxPayload {
  accountId: AccountId;
  tx: EvmTransactionRequest | SolanaTransactionRequest;
}

export interface GetTxHistoryPayload {
  accountId: AccountId;
  chainId?: ChainId;
  limit?: number;
  offset?: number;
}

export interface CancelTxPayload {
  accountId: AccountId;
  originalHash: string;
  chainId: ChainId;
}

export interface SpeedUpTxPayload {
  accountId: AccountId;
  originalHash: string;
  chainId: ChainId;
  newMaxFeePerGas: string;   // hex wei
}

export interface GetGasEstimatePayload {
  chainId: ChainId;
}

export interface GetSwapQuotePayload {
  accountId: AccountId;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;        // human units, decimal string
  slippageBps?: number;
}

export interface ExecuteSwapPayload {
  accountId: AccountId;
  quote: SwapQuote;
}

export interface DAppConnectPayload {
  origin: string;
  name: string;
  favicon?: string;
  requestedChainId: ChainId;
  requestId: string;
}

export interface DAppDisconnectPayload {
  origin: string;
}

export interface DAppApprovePayload {
  dappRequestId: string;     // DAppRequest.id
  accountIds: AccountId[];
}

export interface DAppRejectPayload {
  dappRequestId: string;
}

export interface DAppSignMessagePayload {
  requestId: string;
  accountId: AccountId;
  message: string;           // hex or utf-8 depending on signing method
  origin: string;
}

export interface DAppSignTypedDataPayload {
  requestId: string;
  accountId: AccountId;
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
  origin: string;
}

export interface DAppSignTxPayload {
  requestId: string;
  accountId: AccountId;
  tx: EvmTransactionRequest | SolanaTransactionRequest;
  origin: string;
}

export interface DAppSendTxPayload {
  requestId: string;
  accountId: AccountId;
  tx: EvmTransactionRequest | SolanaTransactionRequest;
  origin: string;
}

export interface DAppRevokePayload {
  origin: string;
}

export interface UpdateSettingsPayload {
  settings: Partial<WalletSettings>;
}

export interface SaveCexCredentialPayload {
  exchangeId: ExchangeId;
  label: string;
  // Plaintext — the background SW encrypts these before writing to the vault.
  // They exist in memory only for the duration of this message.
  apiKey: string;
  secret: string;
  passphrase?: string;   // required by OKX / Bybit
}

export interface DeleteCexCredentialPayload {
  credentialId: string;
}

export interface ValidateCexCredentialPayload {
  credentialId: string;
}

// ---- Response data types -------------------------------------------------

export interface VaultUnlockResponse {
  state: VaultState;
  accounts: Account[];
}

export interface VaultCreateResponse {
  walletId: WalletId;
  // Returned exactly once at creation so the user can back it up.
  // Not stored anywhere outside the encrypted vault.
  mnemonic: string;
  state: VaultState;
  accounts: Account[];
}

export interface ExportMnemonicResponse {
  mnemonic: string;
}

export interface ExportKeyResponse {
  // 0x-prefixed hex (EVM) | base58 (SVM). Treat as maximally sensitive.
  privateKey: string;
}

export interface SignTxResponse {
  signedTx: string;          // hex (EVM) | base64 (SVM)
}

export interface SendTxResponse {
  hash: string;
}

export interface SimulateTxResponse {
  success: boolean;
  gasUsed?: string;          // decimal string, wei / compute units
  revertReason?: string;
  trace?: unknown;
}

export interface TxHistoryResponse {
  records: BaseTxRecord[];
  total: number;
  hasMore: boolean;
}

export interface GasEstimateResponse {
  estimate: EvmGasFeeEstimate | SolanaFeeEstimate;
}

export interface SaveCexCredentialResponse {
  credentialId: string;
  permissions: CexPermission[];
}

// ---- Push message data types (bg → popup) --------------------------------

export interface VaultStateSyncData {
  state: VaultState;
  accounts: Account[];
}

export interface PortfolioSyncData {
  snapshot: PortfolioSnapshot;
}

export interface TxStatusSyncData {
  record: BaseTxRecord;
}

export interface DAppRequestSyncData {
  request: DAppRequest;
}

export interface PopupInitResponse {
  state: PopupState;
  accounts: Account[];
  networks: NetworkConfig[];
  connectedDApps: ConnectedDApp[];
  cexCredentials: CexCredentialsMeta[];
}

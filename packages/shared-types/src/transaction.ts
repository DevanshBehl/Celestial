import type { ChainId } from './chains.js';
import type { AccountId } from './wallet.js';

export enum TxStatus {
  PENDING   = 'pending',
  CONFIRMED = 'confirmed',
  FAILED    = 'failed',
  DROPPED   = 'dropped',
  REPLACED  = 'replaced',
}

export enum TxDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  SELF     = 'self',
}

export interface BaseTxRecord {
  hash: string;
  from: string;
  to: string | null;      // null for contract deployments
  value: string;          // wei / lamports as decimal string
  chainId: ChainId;
  status: TxStatus;
  direction: TxDirection;
  timestamp: number;      // Unix ms — block timestamp once confirmed, submission time while pending
  blockNumber?: number;
  fee?: string;           // total fee paid, in wei / lamports, decimal string
  nonce?: number;         // EVM only
  accountId: AccountId;
  notes?: string;         // user-annotated memo
}

// ---- EVM ----------------------------------------------------------------

export interface EvmTransactionRequest {
  chainId: ChainId;
  from: string;
  to?: string;                    // absent for contract deployment
  value?: string;                 // hex-encoded wei
  data?: string;                  // hex-encoded calldata
  gasLimit?: string;              // hex
  maxFeePerGas?: string;          // hex wei — EIP-1559
  maxPriorityFeePerGas?: string;  // hex wei — EIP-1559
  nonce?: number;
  type?: 0 | 1 | 2;              // legacy | EIP-2930 | EIP-1559
}

export interface EvmGasTier {
  maxFeePerGas: string;           // hex wei
  maxPriorityFeePerGas: string;   // hex wei
  estimatedSeconds: number;
}

export interface EvmGasFeeEstimate {
  chainId: ChainId;
  baseFeePerGas: string;          // hex wei — current block base fee
  slow: EvmGasTier;
  normal: EvmGasTier;
  fast: EvmGasTier;
  estimatedAt: number;            // Unix ms
}

// ---- Solana -------------------------------------------------------------

export interface SolanaInstructionKey {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

export interface SolanaInstruction {
  programId: string;
  keys: SolanaInstructionKey[];
  data: string;                   // base64-encoded instruction bytes
}

export interface SolanaTransactionRequest {
  instructions: SolanaInstruction[];
  feePayer: string;
  priorityFee?: number;           // microlamports per compute unit
  computeUnits?: number;          // explicit compute unit limit
}

export interface SolanaFeeEstimate {
  lamportsPerSignature: number;
  priorityFeePerComputeUnit: number;  // microlamports
  estimatedComputeUnits: number;
  totalLamports: number;
  estimatedAt: number;                // Unix ms
}

// ---- Unions -------------------------------------------------------------

export type TransactionRequest = EvmTransactionRequest | SolanaTransactionRequest;
export type FeeEstimate        = EvmGasFeeEstimate     | SolanaFeeEstimate;

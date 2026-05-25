import { ethers } from 'ethers';
import { CelestialErrorCode } from '@celestial/shared-types';
import type { SendTxPayload, ExtensionMessage, AnyExtensionResponse } from '@celestial/shared-types';
import { aesGcmDecrypt, bytesToUtf8 } from '@celestial/core-crypto';
import { errorResponse, successResponse } from '../../shared/messaging';
import { requireUnlockedVault } from './vault';
import { NETWORK_BY_CHAIN_ID } from '../../shared/constants';

export async function handleTxSend(
  message: ExtensionMessage<SendTxPayload>,
  sender: chrome.runtime.MessageSender
): Promise<AnyExtensionResponse> {
  const { payload, requestId } = message;
  const guard = await requireUnlockedVault(requestId);
  if (!guard.ok) return guard.response;

  const { vault, vaultKey } = guard;
  
  // 1. Get encrypted private key
  const encryptedPayload = vault.accounts[payload.accountId];
  if (!encryptedPayload) {
    return errorResponse(requestId, CelestialErrorCode.INVALID_REQUEST, 'Account not found in vault');
  }

  // 2. Decrypt
  let privateKey: string;
  try {
    const bytes = await aesGcmDecrypt(vaultKey, encryptedPayload);
    privateKey = bytesToUtf8(bytes);
  } catch (e) {
    return errorResponse(requestId, CelestialErrorCode.VAULT_DECRYPTION_FAILED, 'Failed to decrypt account key');
  }

  // 3. Connect to RPC
  // @ts-expect-error - TS gets confused with the union type of EvmTransactionRequest and SolanaTransactionRequest. We cast safely.
  const txReq: any = payload.tx;
  const network = NETWORK_BY_CHAIN_ID.get(txReq.chainId);
  if (!network) {
    return errorResponse(requestId, CelestialErrorCode.INVALID_REQUEST, 'Unsupported chainId');
  }

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // 4. Send transaction
  try {
    const tx = await wallet.sendTransaction({
      to: txReq.to,
      value: txReq.value,
      data: txReq.data,
    });

    return successResponse(requestId, { hash: tx.hash });
  } catch (err: any) {
    return errorResponse(requestId, CelestialErrorCode.TX_FAILED, err.message || 'Transaction failed');
  }
}

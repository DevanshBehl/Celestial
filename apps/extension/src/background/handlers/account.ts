import {
  buildEvmDerivationPath,
  buildSolanaDerivationPath,
  decryptAccountKey,
  deriveEvmAccount,
  deriveSolanaAccount,
  mnemonicToSeed,
  addAccountToVault,
} from '@celestial/core-crypto';
import type {
  Account,
  AnyExtensionResponse,
  CreateAccountPayload,
  ExportKeyPayload,
  ExtensionMessage,
  RenameAccountPayload,
  SwitchAccountPayload,
} from '@celestial/shared-types';
import {
  CelestialErrorCode,
  ChainFamily,
  ChainId,
  MessageType,
} from '@celestial/shared-types';
import { errorResponse, successResponse } from '../../shared/messaging';
import { getSession, setSession } from '../session';
import { getVault, setVault } from '../storage';
import { requireUnlockedVault } from './vault';
import { decryptVaultMnemonic } from '@celestial/core-crypto';

export async function handleAccountMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
): Promise<AnyExtensionResponse> {
  const { type, requestId, payload } = message;

  // ---- ACCOUNT_LIST --------------------------------------------------------
  if (type === MessageType.ACCOUNT_LIST) {
    const { accounts } = getSession();
    return successResponse(requestId, { accounts });
  }

  // ---- ACCOUNT_SWITCH ------------------------------------------------------
  if (type === MessageType.ACCOUNT_SWITCH) {
    const { accountId } = payload as SwitchAccountPayload;
    const { accounts } = getSession();
    const target = accounts.find(a => a.id === accountId);
    if (!target) {
      return errorResponse(requestId, CelestialErrorCode.ACCOUNT_NOT_FOUND, `Account ${accountId} not found`);
    }
    setSession({ activeAccountId: accountId });
    return successResponse(requestId, { accountId });
  }

  // ---- ACCOUNT_RENAME ------------------------------------------------------
  if (type === MessageType.ACCOUNT_RENAME) {
    const { accountId, name } = payload as RenameAccountPayload;
    const session = getSession();
    const updated = session.accounts.map(a => (a.id === accountId ? { ...a, name } : a));
    setSession({ accounts: updated });
    return successResponse(requestId, { accountId, name });
  }

  // ---- ACCOUNT_CREATE ------------------------------------------------------
  if (type === MessageType.ACCOUNT_CREATE) {
    const guard = await requireUnlockedVault(requestId);
    if (!guard.ok) return guard.response;

    const { chainId } = payload as CreateAccountPayload;
    const session = getSession();
    const { vault } = guard;

    // Re-read password from vault key is not possible (non-extractable).
    // We need the plaintext mnemonic — but we've only stored the vault key, not the password.
    // The correct pattern: caller must re-provide password for new account derivation.
    // For now we return NOT_IMPLEMENTED with a clear message.
    // TODO: Accept password in CreateAccountPayload and decrypt mnemonic here.
    return errorResponse(
      requestId,
      CelestialErrorCode.NOT_IMPLEMENTED,
      'Account creation requires password re-entry — add password field to CreateAccountPayload',
    );
  }

  // ---- ACCOUNT_REMOVE ------------------------------------------------------
  if (type === MessageType.ACCOUNT_REMOVE) {
    // TODO: implement account removal (requires vault update to remove private key entry)
    return errorResponse(requestId, CelestialErrorCode.NOT_IMPLEMENTED, 'Account removal not yet implemented');
  }

  // ---- ACCOUNT_EXPORT_KEY --------------------------------------------------
  if (type === MessageType.ACCOUNT_EXPORT_KEY) {
    const { accountId, password } = payload as ExportKeyPayload;
    const vault = await getVault();
    if (!vault) {
      return errorResponse(requestId, CelestialErrorCode.VAULT_NOT_FOUND, 'No vault found');
    }

    let privateKey: string;
    try {
      privateKey = await decryptAccountKey(vault, password, accountId);
    } catch {
      return errorResponse(requestId, CelestialErrorCode.VAULT_WRONG_PASSWORD, 'Wrong password');
    }
    return successResponse(requestId, { privateKey });
  }

  return errorResponse(requestId, CelestialErrorCode.MESSAGE_UNKNOWN_TYPE, `Unrouted account message: ${type}`);
}

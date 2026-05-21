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
import { getVault, setVault, setAccountsMeta } from '../storage';
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
    await setAccountsMeta(updated);
    return successResponse(requestId, { accountId, name });
  }

  // ---- ACCOUNT_CREATE ------------------------------------------------------
  if (type === MessageType.ACCOUNT_CREATE) {
    const guard = await requireUnlockedVault(requestId);
    if (!guard.ok) return guard.response;

    const { chainId, name, walletId, password } = payload as CreateAccountPayload;
    const session = getSession();
    const { vault } = guard;

    let mnemonic: string;
    try {
      mnemonic = await decryptVaultMnemonic(vault, password);
    } catch {
      return errorResponse(requestId, CelestialErrorCode.VAULT_WRONG_PASSWORD, 'Invalid password');
    }

    const seed = await mnemonicToSeed(mnemonic);
    const familyAccounts = session.accounts.filter(a => a.chainId === chainId);
    const maxIndex = familyAccounts.reduce((max, a) => Math.max(max, a.index), -1);
    const accountIndex = maxIndex + 1;
    const accountId = crypto.randomUUID();

    let privateKeyMaterial: string;
    let address: string;
    let derivationPath: string;
    let chainFamily: ChainFamily;

    if (chainId === ChainId.SOLANA) {
      derivationPath = buildSolanaDerivationPath(accountIndex);
      const derived = deriveSolanaAccount(seed, derivationPath);
      privateKeyMaterial = derived.privateKeyHex;
      address = derived.address;
      chainFamily = ChainFamily.SVM;
    } else {
      derivationPath = buildEvmDerivationPath(accountIndex);
      const derived = deriveEvmAccount(seed, derivationPath);
      privateKeyMaterial = derived.privateKeyHex;
      address = derived.address;
      chainFamily = ChainFamily.EVM;
    }

    const updatedVault = await addAccountToVault(vault, password, accountId, privateKeyMaterial);
    await setVault(updatedVault);

    const newAccount: Account = {
      id: accountId,
      walletId,
      name: name || `Account ${accountIndex + 1}`,
      address,
      chainFamily,
      chainId,
      derivationPath,
      index: accountIndex,
    };

    const newAccounts = [...session.accounts, newAccount];
    setSession({ accounts: newAccounts, activeAccountId: accountId });
    await setAccountsMeta(newAccounts);

    return successResponse(requestId, { account: newAccount, allAccounts: newAccounts });
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

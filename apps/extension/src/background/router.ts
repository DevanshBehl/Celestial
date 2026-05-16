import type { AnyExtensionResponse, ExtensionMessage } from '@celestial/shared-types';
import { CelestialErrorCode, MessageType } from '@celestial/shared-types';
import { errorResponse } from '../shared/messaging';
import { handleVaultMessage } from './handlers/vault';
import { handleAccountMessage } from './handlers/account';
import { handleNetworkMessage } from './handlers/network';

const VAULT_TYPES = new Set<MessageType>([
  MessageType.VAULT_UNLOCK,
  MessageType.VAULT_LOCK,
  MessageType.VAULT_CREATE,
  MessageType.VAULT_IMPORT,
  MessageType.VAULT_CHANGE_PASSWORD,
  MessageType.VAULT_STATE_GET,
  MessageType.POPUP_INIT,
]);

const ACCOUNT_TYPES = new Set<MessageType>([
  MessageType.ACCOUNT_CREATE,
  MessageType.ACCOUNT_RENAME,
  MessageType.ACCOUNT_LIST,
  MessageType.ACCOUNT_SWITCH,
  MessageType.ACCOUNT_REMOVE,
  MessageType.ACCOUNT_EXPORT_KEY,
]);

const NETWORK_TYPES = new Set<MessageType>([
  MessageType.NETWORK_SWITCH,
  MessageType.NETWORK_LIST,
  MessageType.NETWORK_ADD_CUSTOM,
  MessageType.NETWORK_REMOVE_CUSTOM,
]);

// Routes every incoming chrome.runtime.onMessage to the correct domain handler.
// All handlers are async; errors thrown from them are caught here and returned
// as structured ExtensionErrorResponse objects so the popup always gets a reply.
export async function routeMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
): Promise<AnyExtensionResponse> {
  try {
    const { type, requestId } = message;

    if (VAULT_TYPES.has(type)) return handleVaultMessage(message, sender);
    if (ACCOUNT_TYPES.has(type)) return handleAccountMessage(message, sender);
    if (NETWORK_TYPES.has(type)) return handleNetworkMessage(message, sender);

    // Remaining message types are stubs — they will be filled in subsequent sprints.
    return errorResponse(
      requestId,
      CelestialErrorCode.NOT_IMPLEMENTED,
      `Handler for "${type}" is not yet implemented`,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[celestial/bg] Unhandled error in routeMessage:', err);
    return errorResponse(
      message.requestId,
      CelestialErrorCode.INTERNAL_ERROR,
      errorMessage,
    );
  }
}

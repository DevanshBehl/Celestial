import type { AnyExtensionResponse, ExtensionMessage } from '@celestial/shared-types';
import { CelestialErrorCode, MessageType } from '@celestial/shared-types';
import { BUILTIN_NETWORKS, NETWORK_BY_CHAIN_ID } from '../../shared/constants';
import { errorResponse, successResponse } from '../../shared/messaging';
import { getSession, setSession } from '../session';
import { getCustomNetworks, setCustomNetworks } from '../storage';
import type { AddCustomNetworkPayload, RemoveCustomNetworkPayload, SwitchNetworkPayload } from '@celestial/shared-types';

export async function handleNetworkMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
): Promise<AnyExtensionResponse> {
  const { type, requestId, payload } = message;

  // ---- NETWORK_LIST --------------------------------------------------------
  if (type === MessageType.NETWORK_LIST) {
    const custom = await getCustomNetworks();
    const all = [
      ...BUILTIN_NETWORKS,
      ...custom.filter(n => !NETWORK_BY_CHAIN_ID.has(n.chainId)),
    ];
    return successResponse(requestId, { networks: all });
  }

  // ---- NETWORK_SWITCH ------------------------------------------------------
  if (type === MessageType.NETWORK_SWITCH) {
    const { chainId } = payload as SwitchNetworkPayload;
    const custom = await getCustomNetworks();
    const known = [...BUILTIN_NETWORKS, ...custom].find(n => n.chainId === chainId);
    if (!known) {
      return errorResponse(requestId, CelestialErrorCode.CHAIN_UNSUPPORTED, `Chain ${chainId} is not configured`);
    }
    setSession({ activeChainId: chainId });
    return successResponse(requestId, { chainId });
  }

  // ---- NETWORK_ADD_CUSTOM --------------------------------------------------
  if (type === MessageType.NETWORK_ADD_CUSTOM) {
    const { config } = payload as AddCustomNetworkPayload;
    const existing = await getCustomNetworks();
    if (existing.some(n => n.chainId === config.chainId)) {
      return errorResponse(requestId, CelestialErrorCode.VALIDATION_ERROR, `Chain ${config.chainId} already exists`);
    }
    await setCustomNetworks([...existing, config]);
    return successResponse(requestId, { chainId: config.chainId });
  }

  // ---- NETWORK_REMOVE_CUSTOM -----------------------------------------------
  if (type === MessageType.NETWORK_REMOVE_CUSTOM) {
    const { chainId } = payload as RemoveCustomNetworkPayload;
    if (NETWORK_BY_CHAIN_ID.has(chainId)) {
      return errorResponse(requestId, CelestialErrorCode.VALIDATION_ERROR, 'Cannot remove a built-in network');
    }
    const existing = await getCustomNetworks();
    await setCustomNetworks(existing.filter(n => n.chainId !== chainId));
    return successResponse(requestId, { chainId });
  }

  return errorResponse(requestId, CelestialErrorCode.MESSAGE_UNKNOWN_TYPE, `Unrouted network message: ${type}`);
}

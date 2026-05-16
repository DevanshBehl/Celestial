import type { ExtensionMessage } from '@celestial/shared-types';
import { CelestialErrorCode, MessageType } from '@celestial/shared-types';
import { AUTO_LOCK_ALARM } from '../shared/constants';
import { buildMessage, pushToPopup } from '../shared/messaging';
import { clearSession } from './session';
import { routeMessage } from './router';

// ---- Message listener ----------------------------------------------------
// Returns `true` to signal we will respond asynchronously (required for MV3).

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    routeMessage(message, sender)
      .then(sendResponse)
      .catch(err => {
        sendResponse({
          requestId: message.requestId,
          success: false,
          error: { code: CelestialErrorCode.INTERNAL_ERROR, message: String(err) },
        });
      });
    return true;
  },
);

// ---- Auto-lock alarm -----------------------------------------------------

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== AUTO_LOCK_ALARM) return;

  clearSession();

  // Push the new locked state to the popup if it is currently open.
  pushToPopup(MessageType.VAULT_STATE_SYNC, {
    state: {
      hasVault: true,
      isLocked: true,
      activeAccountId: null,
      activeChainId: null,
      autoLockMs: 0,
    },
    accounts: [],
  });
});

// ---- Extension install / update ------------------------------------------

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Open the popup on first install so the user can create their wallet.
    chrome.action.openPopup().catch(() => {
      // openPopup() may fail if called outside a user gesture in some Chrome versions — ignore.
    });
  }
});

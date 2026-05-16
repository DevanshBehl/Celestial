import type { Account, AccountId, ChainId } from '@celestial/shared-types';
import { ChainId as ChainIdEnum } from '@celestial/shared-types';

// In-memory session — fully reset when the MV3 service worker is terminated.
// That termination is the auto-lock mechanism: no persistent key, no persistent access.

export interface SessionState {
  isUnlocked: boolean;
  // Non-extractable CryptoKey derived from the user's password.
  // Held only in memory; never written to chrome.storage.
  vaultKey: CryptoKey | null;
  accounts: Account[];
  activeAccountId: AccountId | null;
  activeChainId: ChainId;
  // Mirrors WalletSettings.autoLockMs so we can schedule the alarm without re-reading storage.
  autoLockMs: number;
}

const DEFAULT: SessionState = {
  isUnlocked: false,
  vaultKey: null,
  accounts: [],
  activeAccountId: null,
  activeChainId: ChainIdEnum.ETHEREUM,
  autoLockMs: 5 * 60 * 1_000,
};

let _state: SessionState = { ...DEFAULT };

export function getSession(): Readonly<SessionState> {
  return _state;
}

export function setSession(patch: Partial<SessionState>): void {
  _state = { ..._state, ...patch };
}

// Wipe all sensitive state; preserve autoLockMs setting so the next unlock can
// reschedule the alarm with the same timeout without re-reading storage.
export function clearSession(): void {
  _state = { ...DEFAULT, autoLockMs: _state.autoLockMs };
}

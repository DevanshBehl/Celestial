import { useCallback, useEffect, useReducer } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  Account,
  CexCredentialsMeta,
  NetworkConfig,
  PopupInitResponse,
  PopupState,
  VaultCreateResponse,
  VaultUnlockResponse,
} from '@celestial/shared-types';
import { AppView, MessageType } from '@celestial/shared-types';
import { isSuccess, sendToBackground } from '../shared/messaging';
import Onboarding from './views/Onboarding';
import Unlock from './views/Unlock';
import Dashboard from './views/Dashboard';

// ---- State ---------------------------------------------------------------

interface AppState {
  status: 'loading' | 'ready' | 'error';
  popupState: PopupState | null;
  accounts: Account[];
  networks: NetworkConfig[];
  cexCredentials: CexCredentialsMeta[];
  errorMessage: string | null;
}

type AppAction =
  | { type: 'BOOTSTRAPPED'; data: PopupInitResponse }
  | { type: 'BOOT_ERROR'; message: string }
  | { type: 'VAULT_UNLOCKED'; state: PopupState; accounts: Account[] }
  | { type: 'VAULT_CREATED'; state: PopupState; accounts: Account[] }
  | { type: 'VAULT_LOCKED' }
  | { type: 'VIEW_CHANGE'; view: AppView };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'BOOTSTRAPPED':
      return {
        ...state,
        status: 'ready',
        popupState: action.data.state,
        accounts: action.data.state.vault.isLocked ? [] : state.accounts,
        networks: action.data.networks,
        cexCredentials: action.data.cexCredentials,
      };
    case 'BOOT_ERROR':
      return { ...state, status: 'error', errorMessage: action.message };
    case 'VAULT_UNLOCKED':
    case 'VAULT_CREATED':
      return { ...state, popupState: action.state, accounts: action.accounts };
    case 'VAULT_LOCKED':
      return {
        ...state,
        accounts: [],
        popupState: state.popupState
          ? {
              ...state.popupState,
              vault: { ...state.popupState.vault, isLocked: true },
              view: AppView.UNLOCK,
            }
          : null,
      };
    case 'VIEW_CHANGE':
      return {
        ...state,
        popupState: state.popupState ? { ...state.popupState, view: action.view } : null,
      };
    default:
      return state;
  }
}

const INITIAL: AppState = {
  status: 'loading',
  popupState: null,
  accounts: [],
  networks: [],
  cexCredentials: [],
  errorMessage: null,
};

// ---- Page transition variants -------------------------------------------

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};

// ---- Component ----------------------------------------------------------

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const bootstrap = useCallback(async () => {
    const res = await sendToBackground<PopupInitResponse>(MessageType.POPUP_INIT, {});
    if (isSuccess(res)) {
      dispatch({ type: 'BOOTSTRAPPED', data: res.data });
    } else {
      dispatch({ type: 'BOOT_ERROR', message: res.error.message });
    }
  }, []);

  useEffect(() => {
    void bootstrap();

    const onMessage = (message: { type: string; payload?: unknown }) => {
      if (message.type === MessageType.VAULT_STATE_SYNC) {
        dispatch({ type: 'VAULT_LOCKED' });
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [bootstrap]);

  const handleVaultCreated = useCallback((res: VaultCreateResponse) => {
    dispatch({
      type: 'VAULT_CREATED',
      state: {
        ...(state.popupState ?? ({} as PopupState)),
        vault: res.state,
        view: AppView.DASHBOARD,
      },
      accounts: res.accounts,
    });
  }, [state.popupState]);

  const handleVaultUnlocked = useCallback((res: VaultUnlockResponse) => {
    dispatch({
      type: 'VAULT_UNLOCKED',
      state: {
        ...(state.popupState ?? ({} as PopupState)),
        vault: res.state,
        view: AppView.DASHBOARD,
      },
      accounts: res.accounts,
    });
  }, [state.popupState]);

  const handleLock = useCallback(() => {
    dispatch({ type: 'VAULT_LOCKED' });
  }, []);

  // ---- Render ----------------------------------------------------------

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status === 'error') {
    return <ErrorScreen message={state.errorMessage ?? 'Unknown error'} onRetry={bootstrap} />;
  }

  const { popupState, accounts, networks } = state;
  if (!popupState) return <LoadingScreen />;

  const { vault, view } = popupState;

  const activeView = !vault.hasVault ? AppView.ONBOARDING : vault.isLocked ? AppView.UNLOCK : view;

  return (
    <div className="w-[600px] min-h-[800px] bg-void relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(74,128,160,0.16) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 40% 25% at 85% 95%, rgba(42,144,176,0.08) 0%, transparent 60%)',
        }}
      />

      <AnimatePresence mode="wait">
        {activeView === AppView.ONBOARDING && (
          <motion.div key="onboarding" {...PAGE_VARIANTS} className="relative z-10">
            <Onboarding onCreated={handleVaultCreated} onImported={handleVaultCreated} />
          </motion.div>
        )}

        {activeView === AppView.UNLOCK && (
          <motion.div key="unlock" {...PAGE_VARIANTS} className="relative z-10">
            <Unlock onUnlocked={handleVaultUnlocked} />
          </motion.div>
        )}

        {activeView !== AppView.ONBOARDING && activeView !== AppView.UNLOCK && (
          <motion.div key="dashboard" {...PAGE_VARIANTS} className="relative z-10">
            <Dashboard
              popupState={popupState}
              accounts={accounts}
              networks={networks}
              onLock={handleLock}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Auxiliary screens --------------------------------------------------

function LoadingScreen() {
  return (
    <div className="w-[600px] min-h-[800px] bg-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-nebula/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-nebula animate-spin" />
        </div>
        <p className="text-star-muted text-sm font-medium tracking-wide">Loading Celestial…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-[600px] min-h-[800px] bg-void flex items-center justify-center p-8">
      <div className="glass p-8 max-w-sm w-full text-center flex flex-col items-center gap-5">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-star font-semibold text-lg">Background unavailable</h2>
        <p className="text-star-muted text-sm leading-relaxed">{message}</p>
        <button onClick={onRetry} className="btn-primary w-full">
          Retry
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Account, NetworkConfig, PopupState } from '@celestial/shared-types';
import { AppView, MessageType } from '@celestial/shared-types';
import { NETWORK_BY_CHAIN_ID } from '../../shared/constants';
import { isSuccess, sendToBackground } from '../../shared/messaging';

interface Props {
  popupState: PopupState;
  accounts: Account[];
  networks: NetworkConfig[];
  onLock: () => void;
}

type Tab = 'tokens' | 'activity' | 'defi';

export default function Dashboard({ popupState, accounts, networks, onLock }: Props) {
  const [tab, setTab] = useState<Tab>('tokens');
  const [locking, setLocking] = useState(false);

  const { vault } = popupState;
  const activeAccount = accounts.find(a => a.id === vault.activeAccountId) ?? accounts[0];
  const activeNetwork =
    (vault.activeChainId !== null ? NETWORK_BY_CHAIN_ID.get(vault.activeChainId) : undefined) ??
    networks[0];

  async function handleLock() {
    setLocking(true);
    await sendToBackground(MessageType.VAULT_LOCK, {});
    setLocking(false);
    onLock();
  }

  function truncateAddress(addr: string) {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }

  return (
    <div className="w-[800px] min-h-[600px] flex flex-col">
      {/* ---- Top bar ------------------------------------------------------- */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-nebula/10">
        {/* Network pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer hover:border-nebula/40 transition-colors"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}
        >
          <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-xs font-medium text-star-muted">
            {activeNetwork?.name ?? 'Unknown Network'}
          </span>
        </div>

        {/* Logo */}
        <span className="text-sm font-bold gradient-text tracking-wide">CELESTIAL</span>

        {/* Lock button */}
        <button
          onClick={() => void handleLock()}
          disabled={locking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-star-muted
                     hover:text-star hover:bg-void-200 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M9 5V4a3 3 0 1 0-6 0v1H2v6h8V5H9ZM5 4a1 1 0 1 1 2 0v1H5V4Z"
              fill="currentColor"
            />
          </svg>
          {locking ? '…' : 'Lock'}
        </button>
      </header>

      {/* ---- Account section ----------------------------------------------- */}
      <div className="px-6 py-5 flex flex-col items-center gap-3">
        {/* Account address badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(${
                (activeAccount?.address.charCodeAt(2) ?? 0) * 7
              }deg, 70%, 50%) 0%, hsl(${
                (activeAccount?.address.charCodeAt(4) ?? 0) * 7
              }deg, 70%, 40%) 100%)`,
            }}
          />
          <div>
            <p className="text-star text-sm font-semibold">
              {activeAccount?.name ?? 'Account 1'}
            </p>
            <p className="text-star-dim text-xs font-mono">
              {truncateAddress(activeAccount?.address ?? '')}
            </p>
          </div>
        </div>

        {/* Portfolio value — placeholder */}
        <div className="text-center">
          <p className="text-4xl font-bold text-star tracking-tight">$0.00</p>
          <p className="text-star-dim text-xs mt-0.5">Portfolio value</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mt-1">
          {(['Send', 'Receive', 'Swap', 'Buy'] as const).map(action => (
            <button
              key={action}
              className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium
                         text-star-muted hover:text-star transition-colors"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.14)' }}
            >
              <ActionIcon action={action} />
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Tab bar ------------------------------------------------------- */}
      <div className="flex border-b border-nebula/10 px-5">
        {(['tokens', 'activity', 'defi'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'text-nebula-light' : 'text-star-dim hover:text-star-muted'
            }`}
          >
            {t}
            {tab === t && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-nebula-light rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* ---- Tab content --------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'tokens' && <TokensTab />}
        {tab === 'activity' && <ActivityTab />}
        {tab === 'defi' && <DefiTab />}
      </div>
    </div>
  );
}

// ---- Tab stubs ----------------------------------------------------------

function TokensTab() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="text-3xl opacity-20">◎</div>
      <p className="text-star-muted text-sm font-medium">No tokens yet</p>
      <p className="text-star-dim text-xs max-w-48 leading-relaxed">
        Receive tokens or connect to a dApp to get started.
      </p>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="text-3xl opacity-20">⟳</div>
      <p className="text-star-muted text-sm font-medium">No activity</p>
      <p className="text-star-dim text-xs max-w-48 leading-relaxed">
        Your transaction history will appear here.
      </p>
    </div>
  );
}

function DefiTab() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="text-3xl opacity-20">⬡</div>
      <p className="text-star-muted text-sm font-medium">DeFi coming soon</p>
      <p className="text-star-dim text-xs max-w-48 leading-relaxed">
        Staking, lending, and LP positions will be tracked here.
      </p>
    </div>
  );
}

// ---- Tiny icon component ------------------------------------------------

function ActionIcon({ action }: { action: string }) {
  const paths: Record<string, string> = {
    Send: 'M10 2L2 10M10 2H5M10 2V7',
    Receive: 'M2 10L10 2M2 10H7M2 10V5',
    Swap: 'M2 4h8M8 2l2 2-2 2M10 8H2M4 6l-2 2 2 2',
    Buy: 'M2 2h8l-1 6H3L2 2ZM5 10h2',
  };
  return (
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[action] ?? ''} />
    </svg>
  );
}

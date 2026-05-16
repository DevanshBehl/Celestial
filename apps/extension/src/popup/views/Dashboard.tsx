import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Account, NetworkConfig, PopupState } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { NETWORK_BY_CHAIN_ID } from '../../shared/constants';
import { isSuccess, sendToBackground } from '../../shared/messaging';
import Logo from '../components/Logo';
import PortfolioView from '../components/PortfolioView';
import AssetList from '../components/AssetList';

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

  return (
    <div className="w-[600px] min-h-[800px] flex flex-col">
      {/* ---- Top bar ------------------------------------------------------- */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-nebula/10">
        {/* Network pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer hover:border-nebula/40 transition-colors"
          style={{ background: 'rgba(74,128,160,0.08)', border: '1px solid rgba(74,128,160,0.18)' }}
        >
          <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-xs font-medium text-star-muted">
            {activeNetwork?.name ?? 'Unknown Network'}
          </span>
        </div>

        {/* Logo + wordmark */}
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-sm font-bold gradient-text tracking-wide">CELESTIAL</span>
        </div>

        {/* Lock button */}
        <button
          onClick={() => void handleLock()}
          disabled={locking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-star-muted
                     hover:text-star hover:bg-void-200 transition-all"
        >
          <LockIcon />
          {locking ? '…' : 'Lock'}
        </button>
      </header>

      {/* ---- Portfolio section --------------------------------------------- */}
      <PortfolioView account={activeAccount} totalUsd={0} change24h={0} />

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
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tab === 'tokens' && <AssetList />}
        {tab === 'activity' && <ActivityTab />}
        {tab === 'defi' && <DefiTab />}
      </div>
    </div>
  );
}

// ---- Stub tabs ----------------------------------------------------------

function ActivityTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(74,128,160,0.08)', border: '1px solid rgba(74,128,160,0.14)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-nebula">
          <path d="M10 3v7l4 2" />
          <circle cx="10" cy="10" r="7" />
        </svg>
      </div>
      <p className="text-star-muted text-sm font-medium">No activity</p>
      <p className="text-star-dim text-xs max-w-48 leading-relaxed">
        Your transaction history will appear here.
      </p>
    </div>
  );
}

function DefiTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(74,128,160,0.08)', border: '1px solid rgba(74,128,160,0.14)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-nebula">
          <path d="M3 10h14M10 3l4 7-4 7-4-7 4-7Z" />
        </svg>
      </div>
      <p className="text-star-muted text-sm font-medium">DeFi coming soon</p>
      <p className="text-star-dim text-xs max-w-48 leading-relaxed">
        Staking, lending, and LP positions will be tracked here.
      </p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M9 5V4a3 3 0 1 0-6 0v1H2v6h8V5H9ZM5 4a1 1 0 1 1 2 0v1H5V4Z" fill="currentColor" />
    </svg>
  );
}

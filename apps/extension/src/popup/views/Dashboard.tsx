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

type Tab = 'tokens' | 'collectibles';

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

  const address = activeAccount?.address ?? '';
  const name = activeAccount?.name ?? 'Account 1';
  const truncated = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

  // Deterministic avatar gradient
  const seed1 = address.charCodeAt(2) ?? 0;
  const seed2 = address.charCodeAt(4) ?? 0;

  return (
    <div className="w-[360px] min-h-[600px] flex flex-col">
      {/* ---- Top bar ---- */}
      <header className="flex items-center justify-between px-4 py-2.5">
        {/* User identity */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(${seed1 * 7}deg, 60%, 50%) 0%, hsl(${seed2 * 7}deg, 50%, 35%) 100%)`,
            }}
          />
          <div className="flex flex-col">
            <span className="text-star text-xs font-semibold leading-none flex items-center gap-1">
              @{name}
            </span>
            <span className="text-star-dim text-[10px] font-mono mt-0.5 flex items-center gap-1">
              {truncated}
              <CopyIcon />
            </span>
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          <IconButton onClick={() => {}} title="Messages">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="12" height="10" rx="2" />
              <path d="M2 5l6 4 6-4" />
            </svg>
          </IconButton>
          <IconButton onClick={() => {}} title="Search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="7" cy="7" r="4" />
              <path d="M10 10l3 3" />
            </svg>
          </IconButton>
          <IconButton onClick={() => void handleLock()} title="Lock wallet" disabled={locking}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="10" height="7" rx="2" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </IconButton>
        </div>
      </header>

      {/* ---- Testnet mode banner ---- */}
      {activeNetwork?.name?.toLowerCase().includes('test') && (
        <div
          className="mx-4 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium text-center"
          style={{
            background: 'rgba(184, 144, 48, 0.15)',
            color: '#d4a840',
            border: '1px solid rgba(184, 144, 48, 0.25)',
          }}
        >
          You are currently in Testnet Mode
        </div>
      )}

      {/* ---- Portfolio section ---- */}
      <PortfolioView account={activeAccount} totalUsd={0} change24h={0} />

      {/* ---- Tab bar ---- */}
      <div className="flex items-center justify-between px-4 border-b border-void-300">
        <div className="flex gap-0">
          {(['tokens', 'collectibles'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-2.5 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'text-star' : 'text-star-dim hover:text-star-muted'
              }`}
            >
              {t === 'tokens' ? 'Tokens' : 'Collectibles'}
              {tab === t && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 inset-x-0 h-0.5 rounded-full"
                  style={{ background: '#ab9ff2' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* More options */}
        <button className="text-star-muted hover:text-star transition-colors p-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <circle cx="4" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
            <circle cx="14" cy="9" r="1.5" />
          </svg>
        </button>
      </div>

      {/* ---- Tab content ---- */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tab === 'tokens' && <AssetList />}
        {tab === 'collectibles' && <CollectiblesTab />}
      </div>

      {/* ---- Bottom nav ---- */}
      <nav className="flex items-center justify-around px-4 py-3 border-t border-void-300">
        <NavItem icon="home" label="Home" active />
        <NavItem icon="swap" label="Swap" />
        <NavItem icon="clock" label="History" />
        <NavItem icon="search" label="Search" />
      </nav>
    </div>
  );
}

// ---- Sub components --------------------------------------------------------

function CollectiblesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(171,159,242,0.08)', border: '1px solid rgba(171,159,242,0.14)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-nebula">
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M3 12l4-4 3 3 3-3 4 4" />
        </svg>
      </div>
      <p className="text-star-muted text-sm font-medium">No collectibles yet</p>
      <p className="text-star-dim text-xs max-w-48 leading-relaxed">
        Your NFTs and collectibles will appear here.
      </p>
    </div>
  );
}

function IconButton({ children, onClick, title, disabled }: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-star-muted
                 hover:text-star hover:bg-void-200 transition-all disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <path d="M8 2H3a1 1 0 0 0-1 1v5" />
    </svg>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  const color = active ? 'text-star' : 'text-star-dim hover:text-star-muted';
  return (
    <button className={`flex flex-col items-center gap-1 transition-colors ${color}`}>
      <NavIcon icon={icon} active={active} />
      {/* Invisible label for accessibility */}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const strokeWidth = active ? 2 : 1.5;
  const size = 22;

  switch (icon) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 22 22" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l8-6 8 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="M9 20V12h4v8" stroke={active ? 'var(--void, #000)' : 'currentColor'} />
        </svg>
      );
    case 'swap':
      return (
        <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v14M7 18l-3-3M7 18l3-3M15 18V4M15 4l-3 3M15 4l3 3" />
        </svg>
      );
    case 'clock':
      return (
        <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M11 6v5l3 3" />
        </svg>
      );
    case 'search':
      return (
        <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
          <circle cx="10" cy="10" r="6" />
          <path d="M14.5 14.5L19 19" />
        </svg>
      );
    default:
      return null;
  }
}

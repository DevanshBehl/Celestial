import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account, NetworkConfig, PopupState } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { NETWORK_BY_CHAIN_ID } from '../../shared/constants';
import { isSuccess, sendToBackground } from '../../shared/messaging';
import { fetchBalance } from '../../shared/rpc';
import Logo from '../components/Logo';
import PortfolioView from '../components/PortfolioView';
import AssetList from '../components/AssetList';
import AccountSwitcher from '../components/AccountSwitcher';
import SettingsView from '../components/SettingsView';
import SendView from '../components/SendView';
import HistoryView from '../components/HistoryView';

interface Props {
  popupState: PopupState;
  accounts: Account[];
  networks: NetworkConfig[];
  onLock: () => void;
  onRefresh: () => void;
}

type Tab = 'tokens' | 'collectibles' | 'history';

export default function Dashboard({ popupState, accounts, networks, onLock, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('tokens');
  const [locking, setLocking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [balance, setBalance] = useState('0.00');

  const { vault } = popupState;
  const activeAccount = accounts.find(a => a.id === vault.activeAccountId) ?? accounts[0];
  const activeNetwork =
    (vault.activeChainId !== null ? NETWORK_BY_CHAIN_ID.get(vault.activeChainId) : undefined) ??
    networks[0];

  useEffect(() => {
    let mounted = true;
    if (activeAccount && activeNetwork) {
      setBalance('...');
      fetchBalance(activeAccount.address, activeNetwork)
        .then(bal => {
          if (mounted) setBalance(bal);
        })
        .catch(() => {
          if (mounted) setBalance('0.00');
        });
    }
    return () => {
      mounted = false;
    };
  }, [activeAccount, activeNetwork]);

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

  async function handleSwitchAccount(accountId: string) {
    await sendToBackground(MessageType.ACCOUNT_SWITCH, { accountId });
    onRefresh();
  }

  async function handleAddAccount(password: string): Promise<{ success: boolean; error?: string }> {
    const res = await sendToBackground(MessageType.ACCOUNT_CREATE, {
      walletId: activeAccount?.walletId ?? '',
      chainId: activeAccount?.chainId ?? 1,
      password,
      name: '',
    });
    if (isSuccess(res)) {
      onRefresh();
      return { success: true };
    }
    return { success: false, error: res.error.message };
  }

  return (
    <div className="w-[360px] min-h-[600px] flex flex-col relative overflow-hidden celestial-gradient">
      {/* Background ambient orbs */}
      <motion.div 
        className="absolute -top-[20%] -left-[20%] w-[250px] h-[250px] rounded-full bg-indigo-500/30 blur-[80px] pointer-events-none"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute -bottom-[10%] -right-[10%] w-[300px] h-[300px] rounded-full bg-purple-600/20 blur-[100px] pointer-events-none"
        animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ---- Top bar ---- */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-4 py-2.5 z-10 glass-panel border-b-0"
      >
        {/* User identity */}
        <AccountSwitcher
          accounts={accounts}
          activeAccountId={vault.activeAccountId ?? ''}
          onSwitch={handleSwitchAccount}
          onAddAccount={handleAddAccount}
        />

        {/* Right icons */}
        <div className="flex items-center gap-2">
          <IconButton onClick={() => {}} title="Messages">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="12" height="10" rx="2" />
              <path d="M2 5l6 4 6-4" />
            </svg>
          </IconButton>
          <IconButton onClick={() => setShowSettings(true)} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </IconButton>
          <IconButton onClick={() => void handleLock()} title="Lock wallet" disabled={locking}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="10" height="7" rx="2" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </IconButton>
        </div>
      </motion.header>

      {/* ---- Testnet mode banner ---- */}
      <AnimatePresence>
        {activeNetwork?.isTestnet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-2 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-center z-10 relative overflow-hidden"
            style={{
              background: 'rgba(184, 144, 48, 0.15)',
              color: '#d4a840',
              border: '1px solid rgba(184, 144, 48, 0.25)',
              boxShadow: '0 0 20px rgba(184, 144, 48, 0.1)'
            }}
          >
            You are currently in Testnet Mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Portfolio section ---- */}
      <PortfolioView 
        account={activeAccount} 
        balance={balance} 
        symbol={activeNetwork.nativeCurrency.symbol} 
        change24h={0} 
        onSendClick={() => setShowSend(true)}
      />

      {/* ---- Tab bar ---- */}
      <div className="flex items-center justify-between px-4 border-b border-void-300/30 z-10 relative">
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
                  style={{ background: '#ffffff' }}
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
      <div className="flex-1 overflow-y-auto px-2 py-2 z-10 relative scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'tokens' && <AssetList />}
            {tab === 'collectibles' && <CollectiblesTab />}
            {tab === 'history' && activeAccount && activeNetwork && <HistoryView account={activeAccount} network={activeNetwork} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- Bottom nav ---- */}
      <motion.nav 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-around px-4 py-3 z-10 glass-panel border-t-0"
      >
        <NavItem icon="home" label="Home" active={tab !== 'history'} onClick={() => setTab('tokens')} />
        <NavItem icon="swap" label="Swap" />
        <NavItem icon="clock" label="History" active={tab === 'history'} onClick={() => setTab('history')} />
        <NavItem icon="search" label="Search" />
      </motion.nav>

      {/* ---- Settings Overlay ---- */}
      <AnimatePresence>
        {showSettings && (
          <SettingsView
            accounts={accounts}
            networks={networks}
            activeAccountId={vault.activeAccountId ?? ''}
            activeChainId={vault.activeChainId}
            onClose={() => setShowSettings(false)}
            onRefresh={onRefresh}
          />
        )}
      </AnimatePresence>

      {/* ---- Send Overlay ---- */}
      <AnimatePresence>
        {showSend && activeAccount && activeNetwork && (
          <SendView
            account={activeAccount}
            network={activeNetwork}
            onClose={() => setShowSend(false)}
            onRefresh={onRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Sub components --------------------------------------------------------

function CollectiblesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-moon-50">
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

function NavItem({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  const color = active ? 'text-star' : 'text-star-dim hover:text-star-muted';
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${color}`}>
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

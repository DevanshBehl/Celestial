import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account, NetworkConfig, PopupState } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { NETWORK_BY_CHAIN_ID } from '../../shared/constants';
import { isSuccess, sendToBackground } from '../../shared/messaging';
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
      import('../../shared/rpc').then(({ fetchBalance }) =>
        fetchBalance(activeAccount.address, activeNetwork)
          .then(bal => { if (mounted) setBalance(bal); })
          .catch(() => { if (mounted) setBalance('0.00'); })
      );
    }
    return () => { mounted = false; };
  }, [activeAccount, activeNetwork]);

  async function handleLock() {
    setLocking(true);
    await sendToBackground(MessageType.VAULT_LOCK, {});
    setLocking(false);
    onLock();
  }

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
    <div className="w-[360px] h-[600px] flex flex-col relative overflow-hidden celestial-gradient">
      {/* Background ambient orbs — subtle and constrained */}
      <div 
        className="absolute -top-[60px] -left-[40px] w-[180px] h-[180px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />
      <div 
        className="absolute -bottom-[40px] -right-[30px] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
      />

      {/* ---- Top bar ---- */}
      <header className="flex items-center justify-between px-4 py-2 z-30 glass-panel border-b-0 flex-shrink-0">
        {/* User identity */}
        <AccountSwitcher
          accounts={accounts}
          activeAccountId={vault.activeAccountId ?? ''}
          onSwitch={handleSwitchAccount}
          onAddAccount={handleAddAccount}
        />

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setShowSettings(true)} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </IconButton>
          <IconButton onClick={() => void handleLock()} title="Lock wallet" disabled={locking}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </IconButton>
        </div>
      </header>

      {/* ---- Testnet mode banner ---- */}
      <AnimatePresence>
        {activeNetwork?.isTestnet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-1 mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-center z-10 relative overflow-hidden flex-shrink-0"
            style={{
              background: 'rgba(212, 168, 64, 0.1)',
              color: '#d4a840',
              border: '1px solid rgba(212, 168, 64, 0.2)',
            }}
          >
            ⚠ Testnet Mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Portfolio section ---- */}
      <div className="flex-shrink-0">
        <PortfolioView 
          account={activeAccount} 
          balance={balance} 
          symbol={activeNetwork.nativeCurrency.symbol} 
          change24h={0} 
          onSendClick={() => setShowSend(true)}
        />
      </div>

      {/* ---- Tab bar ---- */}
      <div className="flex items-center px-4 z-10 relative flex-shrink-0" style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.3)' }}>
        <div className="flex gap-0">
          {(['tokens', 'collectibles', 'history'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3.5 py-2.5 text-[11px] font-semibold capitalize transition-colors ${
                tab === t ? 'text-star' : 'text-star-dim hover:text-star-muted'
              }`}
            >
              {t === 'tokens' ? 'Tokens' : t === 'collectibles' ? 'NFTs' : 'Activity'}
              {tab === t && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 inset-x-1 h-[2px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Tab content ---- */}
      <div className="flex-1 overflow-y-auto px-3 py-2 z-10 relative scrollbar-hide min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'tokens' && <AssetList />}
            {tab === 'collectibles' && <CollectiblesTab />}
            {tab === 'history' && activeAccount && activeNetwork && <HistoryView account={activeAccount} network={activeNetwork} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- Bottom nav ---- */}
      <nav 
        className="flex items-center justify-around px-6 py-2.5 z-10 flex-shrink-0"
        style={{ 
          background: 'rgba(9, 9, 11, 0.85)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(63, 63, 70, 0.25)',
        }}
      >
        <NavItem icon="home" label="Home" active={tab === 'tokens' || tab === 'collectibles'} onClick={() => setTab('tokens')} />
        <NavItem icon="swap" label="Swap" />
        <NavItem icon="clock" label="Activity" active={tab === 'history'} onClick={() => setTab('history')} />
        <NavItem icon="search" label="Explore" />
      </nav>

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
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(39, 39, 42, 0.5)', border: '1px solid rgba(63, 63, 70, 0.4)' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-zinc-400">
          <rect x="3" y="3" width="14" height="14" rx="3" />
          <path d="M3 12l4-4 3 3 3-3 4 4" />
        </svg>
      </div>
      <p className="text-star-muted text-sm font-medium">No NFTs yet</p>
      <p className="text-star-dim text-xs max-w-[200px] leading-relaxed">
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
      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400
                 hover:text-zinc-200 hover:bg-white/5 transition-all duration-150 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-200 px-3 py-1 rounded-lg ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
      <NavIcon icon={icon} active={active} />
      <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
    </button>
  );
}

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const strokeWidth = active ? 2 : 1.5;
  const size = 20;

  switch (icon) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 22 22" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l8-6 8 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="M9 20V12h4v8" stroke={active ? '#09090b' : 'currentColor'} />
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

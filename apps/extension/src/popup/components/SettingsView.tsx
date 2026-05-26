import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account, NetworkConfig, ExportMnemonicResponse, ExportKeyResponse } from '@celestial/shared-types';
import { MessageType, ChainId } from '@celestial/shared-types';
import { sendToBackground, isSuccess } from '../../shared/messaging';

interface Props {
  accounts: Account[];
  networks: NetworkConfig[];
  activeAccountId: string;
  activeChainId: number | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SettingsView({ accounts, networks, activeAccountId, activeChainId, onClose, onRefresh }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewingSecret, setViewingSecret] = useState<'none' | 'seed' | 'privateKey'>('none');
  const [secretValue, setSecretValue] = useState('');
  const [copied, setCopied] = useState(false);

  const activeAccount = accounts.find(a => a.id === activeAccountId) ?? accounts[0];

  async function handleSwitchNetwork(chainId: number) {
    const res = await sendToBackground(MessageType.NETWORK_SWITCH, { chainId });
    if (isSuccess(res)) {
      onRefresh();
    }
  }

  async function handleExportSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoading(true);

    if (viewingSecret === 'seed') {
      const res = await sendToBackground<ExportMnemonicResponse>(MessageType.VAULT_EXPORT_MNEMONIC, { password });
      if (isSuccess(res)) {
        setSecretValue(res.data.mnemonic);
        setPassword('');
      } else {
        setError(res.error?.message || 'Failed to unlock');
      }
    } else if (viewingSecret === 'privateKey') {
      if (!activeAccount) return;
      const res = await sendToBackground<ExportKeyResponse>(MessageType.ACCOUNT_EXPORT_KEY, { 
        accountId: activeAccount.id, 
        password 
      });
      if (isSuccess(res)) {
        setSecretValue(res.data.privateKey);
        setPassword('');
      } else {
        setError(res.error?.message || 'Failed to unlock');
      }
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(secretValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function renderSecretView() {
    if (!secretValue) {
      return (
        <form onSubmit={handleExportSecret} className="flex flex-col gap-3.5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Enter your password to reveal your {viewingSecret === 'seed' ? 'seed phrase' : 'private key'}.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="input-field"
            autoFocus
          />
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(192, 72, 96, 0.1)', border: '1px solid rgba(192, 72, 96, 0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}
          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => {
                setViewingSecret('none');
                setPassword('');
                setError('');
              }}
              className="flex-1 btn-secondary py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 btn-primary py-2.5 text-sm"
            >
              {loading ? 'Unlocking…' : 'Unlock'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="flex flex-col gap-3.5">
        <div className="p-3.5 rounded-xl" style={{ background: 'rgba(192, 72, 96, 0.08)', border: '1px solid rgba(192, 72, 96, 0.18)' }}>
          <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            NEVER SHARE THIS
          </p>
          <p className="text-xs text-red-400/80 leading-relaxed">
            Anyone with your {viewingSecret === 'seed' ? 'seed phrase' : 'private key'} can steal all your assets.
          </p>
        </div>

        <div className="relative group">
          <textarea
            readOnly
            value={secretValue}
            className="w-full p-3.5 text-sm text-zinc-200 rounded-xl resize-none font-mono focus:outline-none leading-relaxed"
            style={{ background: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(63, 63, 70, 0.5)' }}
            rows={viewingSecret === 'seed' ? 3 : 2}
          />
          <button
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg transition-all duration-150"
            style={{ background: 'rgba(39, 39, 42, 0.8)' }}
            title="Copy to clipboard"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
        
        <button
          onClick={() => {
            setViewingSecret('none');
            setSecretValue('');
            setPassword('');
          }}
          className="w-full btn-secondary py-2.5 text-sm"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0, 0, 0, 0.92)', backdropFilter: 'blur(24px)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.3)' }}>
        <h2 className="text-base font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 scrollbar-hide">
        {/* Network Selection */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-zinc-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="section-label">Network</span>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <NetworkOption
              name="Ethereum Mainnet"
              color="#6366f1"
              active={activeChainId === ChainId.ETHEREUM}
              onClick={() => handleSwitchNetwork(ChainId.ETHEREUM)}
            />
            <NetworkOption
              name="Sepolia Testnet"
              color="#eab308"
              active={activeChainId === ChainId.SEPOLIA}
              onClick={() => handleSwitchNetwork(ChainId.SEPOLIA)}
              isTestnet
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-zinc-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="section-label">Security</span>
          </div>
          
          <AnimatePresence mode="wait">
            {viewingSecret !== 'none' ? (
              <motion.div
                key="secret-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderSecretView()}
              </motion.div>
            ) : (
              <motion.div
                key="security-menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-1.5"
              >
                <SecurityButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                  }
                  title="View Seed Phrase"
                  subtitle="Back up your wallet"
                  onClick={() => setViewingSecret('seed')}
                />
                <SecurityButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  }
                  title="View Private Key"
                  subtitle={activeAccount?.name ?? 'Active account'}
                  onClick={() => setViewingSecret('privateKey')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* About Section */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-zinc-500">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="section-label">About</span>
          </div>
          <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(63, 63, 70, 0.3)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Version</span>
              <span className="text-sm text-zinc-500 font-mono">1.0.0</span>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

// ---- Sub-components ----

function NetworkOption({ name, color, active, onClick, isTestnet }: {
  name: string; color: string; active: boolean; onClick: () => void; isTestnet?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200"
      style={{
        background: active ? 'rgba(255, 255, 255, 0.05)' : 'rgba(24, 24, 27, 0.3)',
        border: active ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(63, 63, 70, 0.3)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200">{name}</span>
          {isTestnet && (
            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              TEST
            </span>
          )}
        </div>
      </div>
      {active && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

function SecurityButton({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 group"
      style={{ background: 'rgba(24, 24, 27, 0.3)', border: '1px solid rgba(63, 63, 70, 0.3)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(39, 39, 42, 0.6)' }}>
          {icon}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{title}</span>
          <span className="text-[11px] text-zinc-500">{subtitle}</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </motion.button>
  );
}

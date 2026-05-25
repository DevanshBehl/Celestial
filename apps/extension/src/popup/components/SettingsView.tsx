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
        <form onSubmit={handleExportSecret} className="flex flex-col gap-4">
          <p className="text-sm text-star-muted">
            Enter your password to reveal your {viewingSecret === 'seed' ? 'seed phrase' : 'private key'}.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors"
            autoFocus
          />
          {error && <span className="text-xs text-danger">{error}</span>}
          <div className="flex gap-3">
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
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-xs font-semibold text-danger mb-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            CAUTION
          </p>
          <p className="text-xs text-danger/90">
            Do not share these with anyone else. Anyone with your {viewingSecret === 'seed' ? 'seed phrase' : 'private key'} can steal your assets.
          </p>
        </div>

        <div className="relative group">
          <textarea
            readOnly
            value={secretValue}
            className="w-full p-4 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl resize-none font-mono focus:outline-none"
            rows={viewingSecret === 'seed' ? 3 : 2}
          />
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-star transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-50 backdrop-blur-xl bg-void/80 flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-void-300">
        <h2 className="text-lg font-semibold text-star">Settings</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-star-muted hover:text-star hover:bg-void-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8">
        {/* Network Selection */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-star-dim uppercase tracking-wider">Network</h3>
          <div className="flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSwitchNetwork(ChainId.ETHEREUM)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors glass-btn ${
                activeChainId === ChainId.ETHEREUM 
                  ? 'border-moon-50 bg-moon-50/10' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-star">Ethereum Mainnet</span>
              </div>
              {activeChainId === ChainId.ETHEREUM && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--moon-50)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSwitchNetwork(ChainId.SEPOLIA)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors glass-btn ${
                activeChainId === ChainId.SEPOLIA 
                  ? 'border-moon-50 bg-moon-50/10' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-star">Sepolia Testnet</span>
              </div>
              {activeChainId === ChainId.SEPOLIA && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--moon-50)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </motion.button>
          </div>
        </section>

        {/* Security Section */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-star-dim uppercase tracking-wider">Security</h3>
          <AnimatePresence mode="wait">
            {viewingSecret !== 'none' ? (
              <motion.div
                key="secret-view"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {renderSecretView()}
              </motion.div>
            ) : (
              <motion.div
                key="security-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewingSecret('seed')}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors group glass-btn"
                >
                  <div className="flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-star-muted group-hover:text-star">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                    <span className="text-sm font-medium text-star">View Seed Phrase</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-star-dim">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewingSecret('privateKey')}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors group glass-btn"
                >
                  <div className="flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-star-muted group-hover:text-star">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium text-star">View Private Key</span>
                      <span className="text-xs text-star-dim">{activeAccount?.name}</span>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-star-dim">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
}

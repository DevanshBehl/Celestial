import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { isSuccess, sendToBackground } from '../../shared/messaging';

interface Props {
  accounts: Account[];
  activeAccountId: string;
  onSwitch: (accountId: string) => void;
  onAddAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
}

/** Generate a deterministic colorful gradient from an address */
function avatarGradient(address: string) {
  const s1 = address.charCodeAt(2) ?? 0;
  const s2 = address.charCodeAt(4) ?? 0;
  const s3 = address.charCodeAt(6) ?? 0;
  const hue1 = (s1 * 13 + s2 * 7) % 360;
  const hue2 = (hue1 + 40 + (s3 % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 55%, 45%) 0%, hsl(${hue2}, 45%, 30%) 100%)`;
}

export default function AccountSwitcher({ accounts, activeAccountId, onSwitch, onAddAccount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const handleCopy = (e: React.MouseEvent, address: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const containerRef = useRef<HTMLDivElement>(null);

  const activeAccount = accounts.find(a => a.id === activeAccountId) ?? accounts[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setError('');
        setPassword('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await onAddAccount(password);
    setLoading(false);
    if (res.success) {
      setIsOpen(false);
      setIsAdding(false);
      setPassword('');
    } else {
      setError(res.error || 'Failed to create account');
    }
  }

  function renderAvatar(address: string, size: 'sm' | 'md' = 'sm') {
    const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
    return (
      <div
        className={`${dim} rounded-full flex-shrink-0`}
        style={{ background: avatarGradient(address) }}
      />
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-1.5 py-1 -ml-1.5 rounded-xl hover:bg-white/5 transition-colors"
      >
        {activeAccount && renderAvatar(activeAccount.address)}
        <div className="flex flex-col items-start">
          <span className="text-white text-xs font-semibold leading-none flex items-center gap-1">
            {activeAccount?.name ?? 'Account'}
            {activeAccount?.chainFamily === 'evm' && (
              <span className="text-[7px] uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-1 py-px rounded ml-0.5" style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}>ETH</span>
            )}
            {activeAccount?.chainFamily === 'svm' && (
              <span className="text-[7px] uppercase tracking-wider bg-purple-500/20 text-purple-400 px-1 py-px rounded ml-0.5" style={{ border: '1px solid rgba(168, 85, 247, 0.2)' }}>SOL</span>
            )}
            <svg
              width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" className={`transition-transform duration-200 ml-0.5 text-zinc-400 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path d="M3 4.5l3 3 3-3" />
            </svg>
          </span>
          <span className="text-zinc-500 text-[10px] font-mono mt-0.5">
            {activeAccount?.address 
              ? `${activeAccount.address.slice(0, 6)}…${activeAccount.address.slice(-4)}` 
              : ''}
          </span>
        </div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-1.5 w-[260px] rounded-xl overflow-hidden z-50 flex flex-col"
            style={{ 
              background: 'rgba(15, 15, 18, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(63, 63, 70, 0.3)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2)',
            }}
          >
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="p-3.5 flex flex-col gap-2.5">
                <span className="text-sm font-semibold text-white">New Account</span>
                <p className="text-[11px] text-zinc-500 leading-relaxed">Enter your vault password to derive a new account.</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="input-field text-sm"
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(192, 72, 96, 0.1)' }}>
                    <span className="text-xs text-red-400">{error}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setError(''); setPassword(''); }}
                    className="flex-1 btn-secondary py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="flex-1 btn-primary py-2 text-xs"
                  >
                    {loading ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-hide">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSwitch(acc.id);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 transition-all duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(39, 39, 42, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-2.5">
                        {renderAvatar(acc.address, 'md')}
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-zinc-200">{acc.name}</span>
                            {acc.chainFamily === 'evm' && (
                              <span className="text-[8px] uppercase tracking-wider bg-indigo-500/15 text-indigo-400 px-1 py-px rounded" style={{ border: '1px solid rgba(99, 102, 241, 0.15)' }}>ETH</span>
                            )}
                            {acc.chainFamily === 'svm' && (
                              <span className="text-[8px] uppercase tracking-wider bg-purple-500/15 text-purple-400 px-1 py-px rounded" style={{ border: '1px solid rgba(168, 85, 247, 0.15)' }}>SOL</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {`${acc.address.slice(0, 6)}…${acc.address.slice(-4)}`}
                            </span>
                            <button
                              onClick={(e) => handleCopy(e, acc.address, acc.id)}
                              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
                              title="Copy Address"
                            >
                              {copiedId === acc.id ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      {acc.id === activeAccountId && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-1.5" style={{ borderTop: '1px solid rgba(63, 63, 70, 0.25)' }}>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 font-medium text-sm transition-colors hover:bg-white/5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Account
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

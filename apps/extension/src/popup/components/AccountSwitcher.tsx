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

export default function AccountSwitcher({ accounts, activeAccountId, onSwitch, onAddAccount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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

  function renderAvatar(address: string) {
    const seed1 = address.charCodeAt(2) ?? 0;
    const seed2 = address.charCodeAt(4) ?? 0;
    return (
      <div
        className="w-8 h-8 rounded-full flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, hsl(0, 0%, ${40 + (seed1 % 30)}%) 0%, hsl(0, 0%, ${10 + (seed2 % 20)}%) 100%)`,
        }}
      />
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2 py-1.5 -ml-2 rounded-xl hover:bg-void-200 transition-colors"
      >
        {activeAccount && renderAvatar(activeAccount.address)}
        <div className="flex flex-col items-start">
          <span className="text-star text-xs font-semibold leading-none flex items-center gap-1">
            {activeAccount?.name ?? 'Account'}
            <svg
              width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path d="M3 4.5l3 3 3-3" />
            </svg>
          </span>
          <span className="text-star-dim text-[10px] font-mono mt-0.5 flex items-center gap-1">
            {activeAccount?.address 
              ? `${activeAccount.address.slice(0, 6)}…${activeAccount.address.slice(-4)}` 
              : ''}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 flex flex-col"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
          >
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="p-4 flex flex-col gap-3">
                <span className="text-sm font-semibold text-star">Confirm Password</span>
                <p className="text-xs text-star-muted">Enter your vault password to derive a new account.</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 text-sm text-star bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-moon-50 transition-colors"
                  autoFocus
                />
                {error && <span className="text-xs text-danger">{error}</span>}
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 btn-secondary py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="flex-1 btn-primary py-2 text-xs"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto py-2">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSwitch(acc.id);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-void-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {renderAvatar(acc.address)}
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-star">{acc.name}</span>
                          <span className="text-xs text-star-dim font-mono">
                            {`${acc.address.slice(0, 6)}…${acc.address.slice(-4)}`}
                          </span>
                        </div>
                      </div>
                      {acc.id === activeAccountId && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-zinc-800">
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-zinc-800 text-moon-light font-medium text-sm transition-colors"
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

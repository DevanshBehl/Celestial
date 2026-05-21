import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { VaultUnlockResponse } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { isSuccess, sendToBackground } from '../../shared/messaging';
import Logo, { AnimatedMoon } from '../components/Logo';

interface Props {
  onUnlocked: (res: VaultUnlockResponse) => void;
}

export default function Unlock({ onUnlocked }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUnlock() {
    if (!password) return;
    setError('');
    setLoading(true);
    try {
      const res = await sendToBackground<VaultUnlockResponse>(MessageType.VAULT_UNLOCK, { password });
      if (isSuccess(res)) {
        onUnlocked(res.data);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(`Incorrect password${next >= 3 ? ` (${next} attempts)` : '.'}`);
        setPassword('');
        inputRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-[360px] min-h-[600px] flex flex-col">
      {/* ---- Header bar ---- */}
      <header className="flex items-center justify-center py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="celestial-title text-2xl">Celestial</span>
        </div>
        <button
          className="absolute right-5 w-7 h-7 rounded-full flex items-center justify-center
                     border border-moon/20 text-star-muted hover:text-star hover:border-moon/40 transition-colors"
          title="Help"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M6.5 6a1.5 1.5 0 0 1 3 0c0 1-1.5 1.25-1.5 2.5M8 11h.01" />
          </svg>
        </button>
      </header>

      {/* ---- Content ---- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }}
          className="flex flex-col items-center gap-6 w-full"
        >
          {/* Animated crescent moon */}
          <AnimatedMoon size={100} />

          {/* Title */}
          <h1 className="text-2xl font-bold text-star text-center">
            Enter your password
          </h1>

          {/* Password input */}
          <div className="w-full flex flex-col gap-4">
            <input
              ref={inputRef}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') void handleUnlock(); }}
              className="w-full px-4 py-3.5 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors placeholder-star-dim"
              autoFocus
              autoComplete="current-password"
              disabled={loading}
            />

            <AnimatedError message={error} />

            {/* Unlock button */}
            <button
              onClick={() => void handleUnlock()}
              disabled={loading || !password}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-void/30 border-t-void animate-spin" />
                  Unlocking…
                </span>
              ) : (
                'Unlock'
              )}
            </button>
          </div>

          {/* Forgot password link */}
          <p className="text-moon font-semibold text-sm cursor-pointer hover:text-moon-light transition-colors">
            Forgot password
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function AnimatedError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-danger text-xs text-center"
    >
      {message}
    </motion.p>
  );
}

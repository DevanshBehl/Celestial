import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { VaultUnlockResponse } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { isSuccess, sendToBackground } from '../../shared/messaging';
import Logo from '../components/Logo';

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
    <div className="w-[600px] min-h-[800px] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } }}
        className="glass p-10 w-80 flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
          style={{
            background: 'linear-gradient(135deg, rgba(74,128,160,0.22) 0%, rgba(42,144,176,0.14) 100%)',
            border: '1px solid rgba(74,128,160,0.28)',
            boxShadow: '0 0 32px rgba(74,128,160,0.18)',
          }}
        >
          <Logo size={36} />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold gradient-text mb-1">Celestial</h1>
          <p className="text-star-muted text-xs">Enter your password to unlock</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') void handleUnlock(); }}
            className="glass-input w-full px-4 py-3 text-sm text-star placeholder-star-dim"
            autoFocus
            autoComplete="current-password"
            disabled={loading}
          />

          <AnimatedError message={error} />

          <button
            onClick={() => void handleUnlock()}
            disabled={loading || !password}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Unlocking…
              </span>
            ) : (
              'Unlock'
            )}
          </button>
        </div>

        <p className="text-star-dim text-xs text-center">
          Forgot your password?{' '}
          <span className="text-nebula-light cursor-pointer hover:underline">
            Restore with recovery phrase
          </span>
        </p>
      </motion.div>
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

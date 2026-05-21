import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VaultUnlockResponse } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { isSuccess, sendToBackground } from '../../shared/messaging';

interface Props {
  onUnlocked: (res: VaultUnlockResponse) => void;
}

export default function Unlock({ onUnlocked }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input immediately
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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
    <div className="relative w-[360px] h-[600px] overflow-hidden bg-black text-white selection:bg-white/20">
      
      {/* ---- Static Image Background ---- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/moon-bg.png" 
          alt="Moon background" 
          className="w-full h-full object-cover object-center"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        
        {/* Ambient Mesh Gradient Blobs */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-white/5 rounded-full blur-3xl pointer-events-none"
        />
      </div>

      {/* ---- Foreground UI ---- */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 py-8">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5H5a2 2 0 0 1 0-4h16v4" />
              </svg>
            </div>
            <span className="celestial-title text-2xl tracking-wide text-white drop-shadow-md">Celestial</span>
          </div>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </motion.header>

        {/* Center Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative"
        >
          {/* Card subtle outer glow */}
          <div className="absolute -inset-1 bg-gradient-to-b from-white/10 to-transparent blur-xl opacity-50 rounded-[32px] pointer-events-none" />
          
          <div className="relative w-full rounded-[28px] bg-black/20 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden p-6">
            
            {/* Internal top gradient highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

            <div className="flex flex-col items-center text-center gap-1 mb-6">
              <h2 className="text-white/50 text-sm font-medium tracking-widest uppercase">Welcome Back</h2>
              <p className="text-white text-2xl font-bold tracking-tight">Wallet 1</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative group">
                <input
                  ref={inputRef}
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') void handleUnlock(); }}
                  disabled={loading}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-white/30 
                             focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-black/60 transition-all
                             group-hover:border-white/20"
                />
              </div>

              <AnimatedError message={error} />

              <div className="flex gap-2">
                <button
                  onClick={() => void handleUnlock()}
                  disabled={loading || !password}
                  className="flex-1 bg-white text-black font-semibold rounded-2xl py-4 text-sm transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
                >
                  {loading ? 'Unlocking...' : 'Unlock Wallet'}
                </button>
                <button 
                  className="w-14 shrink-0 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors active:scale-[0.95]"
                  title="Biometric Login"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                    <path d="M2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2" />
                    <path d="M5.5 12C5.5 15.589 8.411 18.5 12 18.5" />
                    <path d="M8.5 12C8.5 13.933 10.067 15.5 12 15.5" />
                    <path d="M12 9V12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button className="text-white/40 hover:text-white/80 text-xs font-medium transition-colors">
                Forgot password?
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-between w-full text-[10px] font-medium text-white/30 uppercase tracking-widest"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span>Ethereum Mainnet</span>
          </div>
          <span>Powered by Antigravity</span>
        </motion.footer>

      </div>
    </div>
  );
}

function AnimatedError({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: -4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="text-red-400 text-xs text-center"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

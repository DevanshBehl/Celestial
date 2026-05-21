import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VaultCreateResponse } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { generateMnemonic, validateMnemonic } from '@celestial/core-crypto';
import { isSuccess, sendToBackground } from '../../shared/messaging';
import Logo, { AnimatedMoon } from '../components/Logo';

type Step = 'landing' | 'create-phrase' | 'create-password' | 'import';

interface Props {
  onCreated: (res: VaultCreateResponse) => void;
  onImported: (res: VaultCreateResponse) => void;
}

const SLIDE = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function Onboarding({ onCreated, onImported }: Props) {
  const [step, setStep] = useState<Step>('landing');
  const [mnemonic, setMnemonic] = useState('');
  const [importPhrase, setImportPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function handleStartCreate() {
    const phrase = generateMnemonic(128);
    setMnemonic(phrase);
    setStep('create-phrase');
  }

  async function handleCreateWallet() {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await sendToBackground<VaultCreateResponse>(MessageType.VAULT_CREATE, {
        mnemonic,
        password,
        walletName: 'My Wallet',
      });
      if (isSuccess(res)) { onCreated(res.data); } else { setError(res.error.message); }
    } finally {
      setLoading(false);
    }
  }

  async function handleImportWallet() {
    setError('');
    const trimmed = importPhrase.trim();
    if (!validateMnemonic(trimmed)) {
      setError('Invalid recovery phrase. Please check the words and try again.');
      return;
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await sendToBackground<VaultCreateResponse>(MessageType.VAULT_IMPORT, {
        mnemonic: trimmed,
        password,
        walletName: 'Imported Wallet',
      });
      if (isSuccess(res)) { onImported(res.data); } else { setError(res.error.message); }
    } finally {
      setLoading(false);
    }
  }

  const words = mnemonic.split(' ');

  return (
    <div className="w-[360px] min-h-[600px] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center gap-2 px-4 py-3 border-b border-zinc-800">
        <Logo size={20} />
        <span className="celestial-title text-xl">CELESTIAL</span>
      </header>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div key="landing" {...SLIDE} className="w-full max-w-xs flex flex-col items-center gap-6">
              {/* Animated moon for welcome */}
              <AnimatedMoon size={70} />

              <div className="text-center flex flex-col items-center gap-2">
                <h2 className="text-2xl font-bold text-star">Welcome</h2>
                <p className="text-star-muted text-sm leading-relaxed">
                  Create a new wallet or restore an existing one with your recovery phrase.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button onClick={handleStartCreate} className="btn-primary w-full">
                  Create new wallet
                </button>
                <button onClick={() => setStep('import')} className="btn-secondary w-full">
                  Import recovery phrase
                </button>
              </div>
            </motion.div>
          )}

          {step === 'create-phrase' && (
            <motion.div key="create-phrase" {...SLIDE} className="w-full flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-star mb-1">Your recovery phrase</h2>
                <p className="text-star-muted text-xs leading-relaxed">
                  Write these 12 words in order and store them offline. Anyone with this phrase controls your wallet.
                </p>
              </div>

              <div className="relative">
                <div
                  className={`grid grid-cols-3 gap-2 transition-all duration-300 ${!revealed ? 'blur-sm select-none' : ''}`}
                >
                  {words.map((word, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800"
                    >
                      <span className="text-moon-50 font-mono w-4 flex-shrink-0 text-[10px]">{i + 1}.</span>
                      <span className="text-star font-medium">{word}</span>
                    </div>
                  ))}
                </div>
                {!revealed && (
                  <button
                    onClick={() => setRevealed(true)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm font-medium text-star hover:border-zinc-600 transition-colors">
                      Click to reveal
                    </span>
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('landing')} className="btn-ghost flex-1">Back</button>
                <button
                  onClick={() => { setStep('create-password'); setError(''); }}
                  disabled={!revealed}
                  className="btn-primary flex-1"
                >
                  I've saved it →
                </button>
              </div>
            </motion.div>
          )}

          {step === 'create-password' && (
            <motion.div key="create-password" {...SLIDE} className="w-full max-w-xs flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-star mb-1">Set a password</h2>
                <p className="text-star-muted text-xs leading-relaxed">
                  This encrypts your wallet locally. You'll need it every time you open Celestial.
                </p>
              </div>

              <input
                type="password"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors placeholder-star-dim"
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors placeholder-star-dim"
                onKeyDown={e => { if (e.key === 'Enter') void handleCreateWallet(); }}
              />

              {error && <p className="text-danger text-xs">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep('create-phrase')} className="btn-ghost flex-1">Back</button>
                <button onClick={() => void handleCreateWallet()} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating…' : 'Create wallet'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'import' && (
            <motion.div key="import" {...SLIDE} className="w-full max-w-xs flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-star mb-1">Import wallet</h2>
                <p className="text-star-muted text-xs">Enter your 12 or 24 word recovery phrase.</p>
              </div>

              <textarea
                placeholder="Enter recovery phrase words separated by spaces…"
                value={importPhrase}
                onChange={e => setImportPhrase(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors placeholder-star-dim resize-none"
                spellCheck={false}
                autoComplete="off"
              />
              <input
                type="password"
                placeholder="New password (min. 8 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors placeholder-star-dim"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors placeholder-star-dim"
                onKeyDown={e => { if (e.key === 'Enter') void handleImportWallet(); }}
              />

              {error && <p className="text-danger text-xs">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setStep('landing'); setError(''); }} className="btn-ghost flex-1">Back</button>
                <button onClick={() => void handleImportWallet()} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Importing…' : 'Import wallet'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

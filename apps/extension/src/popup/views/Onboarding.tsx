import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VaultCreateResponse } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { generateMnemonic, validateMnemonic } from '@celestial/core-crypto';
import { isSuccess, sendToBackground } from '../../shared/messaging';

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

  // ---- Step: landing -------------------------------------------------------

  function handleStartCreate() {
    const phrase = generateMnemonic(128);
    setMnemonic(phrase);
    setStep('create-phrase');
  }

  // ---- Step: create-phrase -------------------------------------------------

  // ---- Step: create-password -----------------------------------------------

  async function handleCreateWallet() {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendToBackground<VaultCreateResponse>(MessageType.VAULT_CREATE, {
        mnemonic,
        password,
        walletName: 'My Wallet',
      });
      if (isSuccess(res)) {
        onCreated(res.data);
      } else {
        setError(res.error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // ---- Step: import --------------------------------------------------------

  async function handleImportWallet() {
    setError('');
    const trimmed = importPhrase.trim();
    if (!validateMnemonic(trimmed)) {
      setError('Invalid recovery phrase. Please check the words and try again.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendToBackground<VaultCreateResponse>(MessageType.VAULT_IMPORT, {
        mnemonic: trimmed,
        password,
        walletName: 'Imported Wallet',
      });
      if (isSuccess(res)) {
        onImported(res.data);
      } else {
        setError(res.error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // ---- Render --------------------------------------------------------------

  const words = mnemonic.split(' ');

  return (
    <div className="w-[800px] min-h-[600px] flex">
      {/* Left panel — branding */}
      <div className="w-64 flex-shrink-0 flex flex-col items-center justify-center gap-6 px-8 border-r border-nebula/10">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(6,182,212,0.2) 100%)',
              border: '1px solid rgba(124,58,237,0.35)',
            }}
          >
            ✦
          </div>
          <h1 className="text-xl font-bold gradient-text">Celestial</h1>
          <p className="text-star-dim text-xs text-center leading-relaxed">
            Multi-chain wallet for the decentralised web
          </p>
        </div>

        <div className="w-full space-y-2">
          {['Ethereum', 'Solana', 'Bitcoin', 'EVM L2s'].map(chain => (
            <div
              key={chain}
              className="flex items-center gap-2 text-xs text-star-muted px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(124,58,237,0.06)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-nebula-light flex-shrink-0" />
              {chain}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — step content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div key="landing" {...SLIDE} className="w-full max-w-xs flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-bold text-star mb-1">Get started</h2>
                <p className="text-star-muted text-sm">Create a new wallet or restore an existing one.</p>
              </div>
              <button onClick={handleStartCreate} className="btn-primary w-full">
                Create new wallet
              </button>
              <button onClick={() => setStep('import')} className="btn-secondary w-full">
                Import recovery phrase
              </button>
            </motion.div>
          )}

          {step === 'create-phrase' && (
            <motion.div key="create-phrase" {...SLIDE} className="w-full max-w-sm flex flex-col gap-5">
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
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
                      style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}
                    >
                      <span className="text-nebula-light font-mono w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="text-star font-medium">{word}</span>
                    </div>
                  ))}
                </div>
                {!revealed && (
                  <button
                    onClick={() => setRevealed(true)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="glass px-4 py-2 text-sm font-medium text-star hover:border-nebula/40 transition-colors">
                      Click to reveal
                    </span>
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('landing')} className="btn-ghost flex-1">
                  Back
                </button>
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
                <p className="text-star-muted text-xs">
                  This encrypts your wallet locally. You'll need it to unlock Celestial.
                </p>
              </div>

              <input
                type="password"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm text-star placeholder-star-dim"
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm text-star placeholder-star-dim"
                onKeyDown={e => { if (e.key === 'Enter') void handleCreateWallet(); }}
              />

              {error && <p className="text-danger text-xs">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep('create-phrase')} className="btn-ghost flex-1">
                  Back
                </button>
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
                rows={3}
                className="glass-input w-full px-4 py-3 text-sm text-star placeholder-star-dim resize-none"
                spellCheck={false}
                autoComplete="off"
              />
              <input
                type="password"
                placeholder="New password (min. 8 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm text-star placeholder-star-dim"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm text-star placeholder-star-dim"
                onKeyDown={e => { if (e.key === 'Enter') void handleImportWallet(); }}
              />

              {error && <p className="text-danger text-xs">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setStep('landing'); setError(''); }} className="btn-ghost flex-1">
                  Back
                </button>
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

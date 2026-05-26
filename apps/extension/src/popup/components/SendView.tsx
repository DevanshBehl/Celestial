import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import type { Account, NetworkConfig, SendTxResponse } from '@celestial/shared-types';
import { MessageType } from '@celestial/shared-types';
import { sendToBackground, isSuccess } from '../../shared/messaging';

interface Props {
  account: Account;
  network: NetworkConfig;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SendView({ account, network, onClose, onRefresh }: Props) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!ethers.isAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);

    try {
      // Parse amount to Wei
      const valueInWei = ethers.parseEther(amount).toString();

      const res = await sendToBackground<SendTxResponse>(MessageType.TX_SEND, {
        accountId: account.id,
        tx: {
          chainId: network.chainId,
          from: account.address,
          to: recipient,
          value: ethers.toBeHex(BigInt(valueInWei)),
        },
      });

      if (isSuccess(res)) {
        setTxHash(res.data.hash);
        onRefresh();
      } else {
        setError(res.error?.message || 'Transaction failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M12 6l4 4-4 4" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">Send {network.nativeCurrency.symbol}</h2>
        </div>
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

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {txHash ? (
          /* ---- Success State ---- */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 text-center">
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ 
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.1)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-white">Transaction Sent</h3>
              <p className="text-zinc-500 text-sm mt-1.5 max-w-[240px] leading-relaxed">
                Your transaction has been broadcasted to the network.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-2 w-full mt-2"
            >
              <a 
                href={`${network.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-indigo-400 transition-all duration-200"
                style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
              >
                View on Explorer
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
              <button onClick={onClose} className="w-full btn-primary py-2.5 text-sm">
                Done
              </button>
            </motion.div>
          </div>
        ) : (
          /* ---- Send Form ---- */
          <form onSubmit={handleSend} className="flex-1 flex flex-col px-4 py-5 gap-5">
            {/* From */}
            <div className="flex flex-col gap-1.5">
              <span className="section-label px-0.5">From</span>
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(63, 63, 70, 0.3)' }}>
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, hsl(${(account.address.charCodeAt(2) ?? 0) * 7}, 50%, 45%) 0%, hsl(${(account.address.charCodeAt(4) ?? 0) * 5}, 40%, 30%) 100%)`,
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-zinc-200">{account.name}</span>
                  <span className="text-[11px] text-zinc-500 font-mono truncate">{account.address.slice(0, 8)}…{account.address.slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="flex flex-col gap-1.5">
              <span className="section-label px-0.5">Recipient Address</span>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono text-[13px]"
                autoFocus
              />
            </div>
            
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="section-label">Amount</span>
                <span className="text-[11px] text-zinc-500">{network.nativeCurrency.symbol}</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    // Only allow numbers and one decimal point
                    if (/^\d*\.?\d*$/.test(e.target.value)) {
                      setAmount(e.target.value);
                    }
                  }}
                  placeholder="0.0"
                  className="input-field text-lg font-semibold pr-16"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all duration-150"
                  style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{ background: 'rgba(192, 72, 96, 0.08)', border: '1px solid rgba(192, 72, 96, 0.18)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <div className="mt-auto pb-2">
              <button
                type="submit"
                disabled={loading || !recipient || !amount}
                className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-white animate-spin"></div>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                    </svg>
                    Send Transaction
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

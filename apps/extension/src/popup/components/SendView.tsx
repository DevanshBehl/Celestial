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
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-50 backdrop-blur-xl bg-void/80 flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-void-300">
        <h2 className="text-lg font-semibold text-star">Send {network.nativeCurrency.symbol}</h2>
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

      <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
        {txHash ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center h-full">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </motion.div>
            <h3 className="text-xl font-bold text-star mt-2">Transaction Sent!</h3>
            <p className="text-star-dim text-sm max-w-[250px]">
              Your transaction has been broadcasted to the network.
            </p>
            <a 
              href={`${network.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 px-6 py-2.5 rounded-xl glass-btn text-moon-50 text-sm font-medium hover:bg-moon-50/10 transition-colors"
            >
              View on Explorer
            </a>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-5 h-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-star-dim uppercase tracking-wider">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 text-sm text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors font-mono"
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-star-dim uppercase tracking-wider">Amount ({network.nativeCurrency.symbol})</label>
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
                  className="w-full px-4 py-3 text-lg font-medium text-star bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-moon-50 transition-colors"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-moon-50 bg-moon-50/10 px-2 py-1 rounded"
                >
                  MAX
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl">
                <p className="text-xs text-danger flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <div className="mt-auto pb-4">
              <button
                type="submit"
                disabled={loading || !recipient || !amount}
                className="w-full btn-primary py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-void-800 border-t-white animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  'Review Send'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

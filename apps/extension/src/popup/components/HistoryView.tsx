import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import type { Account, NetworkConfig } from '@celestial/shared-types';
import { ChainId } from '@celestial/shared-types';

interface TxRecord {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
}

export default function HistoryView({ account, network }: { account: Account; network: NetworkConfig }) {
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      if (!account || !network) return;
      setLoading(true);
      setError('');
      try {
        const isSepolia = network.chainId === ChainId.SEPOLIA;
        const baseUrl = isSepolia ? 'https://api-sepolia.etherscan.io/api' : 'https://api.etherscan.io/api';
        
        // Use etherscan public API without key (has rate limits, but works for MVP)
        const res = await fetch(`${baseUrl}?module=account&action=txlist&address=${account.address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`);
        const data = await res.json();
        
        if (mounted) {
          if (data.status === '1' && data.result) {
            setHistory(data.result);
          } else if (data.message === 'No transactions found') {
            setHistory([]);
          } else {
            // Etherscan rate limit or error
            setError(data.result || 'Failed to load history');
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchHistory();
    return () => { mounted = false; };
  }, [account, network]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-void-300 border-t-moon-50 animate-spin"></div>
        <p className="text-star-muted text-sm font-medium">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-danger/10 border border-danger/20">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="8" />
            <line x1="10" y1="6" x2="10" y2="10" />
            <line x1="10" y1="14" x2="10.01" y2="14" />
          </svg>
        </div>
        <p className="text-star-muted text-sm font-medium">Error loading history</p>
        <p className="text-star-dim text-xs max-w-48 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-moon-50">
            <polyline points="2.5 10 7.5 10 10 17.5 15 2.5 17.5 10" />
          </svg>
        </div>
        <p className="text-star-muted text-sm font-medium">No transactions yet</p>
        <p className="text-star-dim text-xs max-w-48 leading-relaxed">
          Your transaction history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      {history.map((tx, i) => {
        const isOut = tx.from.toLowerCase() === account.address.toLowerCase();
        const iconColor = isOut ? 'text-blue-400' : 'text-green-400';
        const iconBg = isOut ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20';
        const formattedValue = parseFloat(ethers.formatEther(tx.value)).toFixed(4);
        const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const isFailed = tx.isError === '1';

        return (
          <motion.a
            href={`${network.explorerUrl}/tx/${tx.hash}`}
            target="_blank"
            rel="noreferrer"
            key={tx.hash}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors glass-btn"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${iconBg} ${iconColor}`}>
                {isOut ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-star">{isOut ? 'Send' : 'Receive'}</span>
                <span className={`text-xs ${isFailed ? 'text-danger' : 'text-star-dim'}`}>
                  {isFailed ? 'Failed' : date}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-star">
                {isOut ? '-' : '+'}{formattedValue} <span className="text-xs text-star-muted">{network.nativeCurrency.symbol}</span>
              </span>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}

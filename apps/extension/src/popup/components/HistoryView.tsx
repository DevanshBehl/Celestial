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
      <div className="flex flex-col gap-2 py-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
            <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded skeleton-shimmer" />
              <div className="h-2.5 w-24 rounded skeleton-shimmer" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-3 w-14 rounded skeleton-shimmer ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(192, 72, 96, 0.1)', border: '1px solid rgba(192, 72, 96, 0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-zinc-300 text-sm font-medium">Couldn't load activity</p>
        <p className="text-zinc-500 text-xs max-w-[200px] leading-relaxed">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(39, 39, 42, 0.5)', border: '1px solid rgba(63, 63, 70, 0.4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-zinc-400">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-zinc-300 text-sm font-medium">No activity yet</p>
        <p className="text-zinc-500 text-xs max-w-[200px] leading-relaxed">
          Your transactions will appear here once you start using your wallet.
        </p>
      </div>
    );
  }

  // Group transactions by date
  const grouped = groupByDate(history);

  return (
    <div className="flex flex-col gap-3 pb-3">
      {Object.entries(grouped).map(([dateLabel, txs]) => (
        <div key={dateLabel} className="flex flex-col gap-1">
          <span className="section-label px-1 py-1">{dateLabel}</span>
          {txs.map((tx, i) => {
            const isOut = tx.from.toLowerCase() === account.address.toLowerCase();
            const formattedValue = parseFloat(ethers.formatEther(tx.value));
            const displayValue = formattedValue > 0.0001 ? formattedValue.toFixed(4) : '<0.0001';
            const time = new Date(parseInt(tx.timeStamp) * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const isFailed = tx.isError === '1';
            const counterparty = isOut ? tx.to : tx.from;

            return (
              <motion.a
                href={`${network.explorerUrl}/tx/${tx.hash}`}
                target="_blank"
                rel="noreferrer"
                key={tx.hash}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group"
                style={{ background: 'rgba(24, 24, 27, 0.25)', border: '1px solid rgba(63, 63, 70, 0.15)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(39, 39, 42, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(63, 63, 70, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(24, 24, 27, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(63, 63, 70, 0.15)';
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isFailed 
                        ? 'rgba(192, 72, 96, 0.1)' 
                        : isOut 
                          ? 'rgba(99, 102, 241, 0.1)' 
                          : 'rgba(34, 197, 94, 0.1)',
                      border: `1px solid ${
                        isFailed 
                          ? 'rgba(192, 72, 96, 0.2)' 
                          : isOut 
                            ? 'rgba(99, 102, 241, 0.2)' 
                            : 'rgba(34, 197, 94, 0.2)'
                      }`,
                    }}
                  >
                    {isFailed ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    ) : isOut ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 7L7 17M7 17h10M7 17V7" />
                      </svg>
                    )}
                  </div>

                  {/* Label & counterparty */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-zinc-200">{isFailed ? 'Failed' : isOut ? 'Sent' : 'Received'}</span>
                      {isFailed && <span className="badge-danger">FAILED</span>}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[120px]">
                      {isOut ? 'To' : 'From'}: {counterparty.slice(0, 6)}…{counterparty.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* Amount & time */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-sm font-semibold tabular-nums ${
                    isFailed ? 'text-zinc-500' : isOut ? 'text-zinc-200' : 'text-emerald-400'
                  }`}>
                    {isOut ? '−' : '+'}{displayValue}
                    <span className="text-[10px] text-zinc-500 ml-1">{network.nativeCurrency.symbol}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">{time}</span>
                </div>
              </motion.a>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Group transactions by relative date label */
function groupByDate(txs: TxRecord[]): Record<string, TxRecord[]> {
  const groups: Record<string, TxRecord[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  for (const tx of txs) {
    const txDate = new Date(parseInt(tx.timeStamp) * 1000);
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
    
    let label: string;
    if (txDay.getTime() === today.getTime()) {
      label = 'Today';
    } else if (txDay.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = txDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: txDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }

  return groups;
}

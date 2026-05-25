import type { Account } from '@celestial/shared-types';
import { motion } from 'framer-motion';

interface Props {
  account: Account | undefined;
  balance: string;
  symbol: string;
  change24h: number;
}

const ACTIONS = ['Send', 'Swap', 'Receive', 'Buy'] as const;
type Action = typeof ACTIONS[number];

export default function PortfolioView({ account, balance, symbol, change24h }: Props) {
  const changePositive = change24h >= 0;
  const changeColor = changePositive ? 'text-success' : 'text-danger';
  const changePrefix = changePositive ? '+' : '';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 py-8 relative z-10"
    >
      {/* Portfolio value */}
      <div className="text-center relative">
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 blur-2xl bg-indigo-500/20 rounded-full"
        />
        <p className="text-4xl font-bold text-star tracking-tight leading-none text-glow relative z-10">
          {balance} <span className="text-2xl text-star-dim">{symbol}</span>
        </p>
        {change24h !== 0 && (
          <p className={`text-xs mt-2 font-medium ${changeColor}`}>
            {changePrefix}{change24h.toFixed(2)}% today
          </p>
        )}
      </div>

      {/* Quick actions — Phantom-style grid */}
      <div className="grid grid-cols-4 gap-3 w-full px-5">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl text-xs font-medium text-star transition-colors glass-btn py-3.5"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-star bg-white/5">
              <ActionIcon action={action} />
            </div>
            <span className="text-[11px] font-semibold tracking-wide">{action}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ActionIcon({ action }: { action: Action }) {
  const iconProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (action) {
    case 'Send':
      return (
        <svg {...iconProps}>
          <path d="M4 10h12M12 6l4 4-4 4" />
        </svg>
      );
    case 'Swap':
      return (
        <svg {...iconProps}>
          <path d="M6 7h8M14 7l-2-2M14 7l-2 2M14 13H6M6 13l2-2M6 13l2 2" />
        </svg>
      );
    case 'Receive':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="12" height="12" rx="2" />
          <rect x="7" y="7" width="6" height="6" rx="1" />
        </svg>
      );
    case 'Buy':
      return (
        <svg {...iconProps}>
          <path d="M10 4v12M6 10h8" />
          <circle cx="10" cy="10" r="7" strokeWidth={1.5} />
        </svg>
      );
  }
}

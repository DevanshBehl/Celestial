import type { Account } from '@celestial/shared-types';
import { motion } from 'framer-motion';

interface Props {
  account: Account | undefined;
  balance: string;
  symbol: string;
  change24h: number;
  onSendClick?: () => void;
}

const ACTIONS = ['Send', 'Swap', 'Receive', 'Buy'] as const;
type Action = typeof ACTIONS[number];

export default function PortfolioView({ account, balance, symbol, change24h, onSendClick }: Props) {
  if (!account) return null;

  const changePositive = change24h >= 0;
  const changeColor = changePositive ? 'text-emerald-400' : 'text-red-400';
  const changePrefix = changePositive ? '+' : '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
      className="flex flex-col items-center gap-5 py-5 relative z-10 px-4"
    >
      {/* Portfolio value */}
      <div className="text-center relative">
        {/* Subtle glow behind the balance */}
        <div 
          className="absolute inset-0 -top-4 -bottom-4 blur-3xl opacity-20 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.3), transparent 70%)' }}
        />
        <p className="text-[32px] font-bold text-white tracking-tight leading-none text-glow relative z-10">
          {balance} <span className="text-lg text-zinc-400 font-medium">{symbol}</span>
        </p>
        {change24h !== 0 && (
          <p className={`text-xs mt-1.5 font-medium ${changeColor}`}>
            {changePrefix}{change24h.toFixed(2)}% today
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action}
            onClick={() => {
              if (action === 'Send' && onSendClick) {
                onSendClick();
              }
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-zinc-300 transition-colors py-2.5 glass-btn"
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.06)' }}
            >
              <ActionIcon action={action} />
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-zinc-400">{action}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ActionIcon({ action }: { action: Action }) {
  const iconProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 20 20',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
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
          <circle cx="10" cy="10" r="7" strokeWidth={1.4} />
        </svg>
      );
  }
}

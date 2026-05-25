import type { Account } from '@celestial/shared-types';

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
    <div className="flex flex-col items-center gap-4 py-5">
      {/* Portfolio value */}
      <div className="text-center">
        <p className="text-3xl font-bold text-star tracking-tight leading-none">
          {balance} <span className="text-xl text-star-dim">{symbol}</span>
        </p>
        {change24h !== 0 && (
          <p className={`text-xs mt-2 font-medium ${changeColor}`}>
            {changePrefix}{change24h.toFixed(2)}% today
          </p>
        )}
      </div>

      {/* Quick actions — Phantom-style grid */}
      <div className="grid grid-cols-4 gap-2 w-full px-4">
        {ACTIONS.map(action => (
          <button
            key={action}
            className="action-card"
          >
            <div className="action-icon">
              <ActionIcon action={action} />
            </div>
            <span className="text-[11px]">{action}</span>
          </button>
        ))}
      </div>
    </div>
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

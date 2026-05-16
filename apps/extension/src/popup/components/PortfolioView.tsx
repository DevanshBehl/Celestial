import type { Account } from '@celestial/shared-types';

interface Props {
  account: Account | undefined;
  totalUsd: number;
  change24h: number;
}

const ACTIONS = ['Send', 'Receive', 'Swap', 'Buy'] as const;
type Action = typeof ACTIONS[number];

export default function PortfolioView({ account, totalUsd, change24h }: Props) {
  const address = account?.address ?? '';
  const name = account?.name ?? 'Account 1';
  const truncated = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

  const changePositive = change24h >= 0;
  const changeColor = changePositive ? 'text-success' : 'text-danger';
  const changePrefix = changePositive ? '+' : '';

  const seed1 = address.charCodeAt(2) ?? 0;
  const seed2 = address.charCodeAt(4) ?? 0;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Account row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${seed1 * 7}deg, 55%, 45%) 0%, hsl(${seed2 * 7}deg, 55%, 35%) 100%)`,
          }}
        />
        <div>
          <p className="text-star text-sm font-semibold leading-none">{name}</p>
          <p className="text-star-muted text-xs font-mono mt-0.5">{truncated}</p>
        </div>
      </div>

      {/* Portfolio value */}
      <div className="text-center">
        <p className="text-4xl font-bold text-star tracking-tight">
          ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {change24h !== 0 && (
          <p className={`text-xs mt-1 font-medium ${changeColor}`}>
            {changePrefix}{change24h.toFixed(2)}% today
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        {ACTIONS.map(action => (
          <button
            key={action}
            className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium
                       text-star-muted hover:text-star transition-colors"
            style={{ background: 'rgba(74,128,160,0.08)', border: '1px solid rgba(74,128,160,0.14)' }}
          >
            <ActionIcon action={action} />
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionIcon({ action }: { action: Action }) {
  const paths: Record<Action, string> = {
    Send: 'M10 2L2 10M10 2H5M10 2V7',
    Receive: 'M2 10L10 2M2 10H7M2 10V5',
    Swap: 'M2 4h8M8 2l2 2-2 2M10 8H2M4 6l-2 2 2 2',
    Buy: 'M2 2h8l-1 6H3L2 2ZM5 10h2',
  };
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[action]} />
    </svg>
  );
}

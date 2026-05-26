interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  iconColor: string;
  verified?: boolean;
}

interface Props {
  assets?: Asset[];
  loading?: boolean;
}

export default function AssetList({ assets = [], loading = false }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1">
        {[1, 2, 3].map(i => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(39, 39, 42, 0.5)', border: '1px solid rgba(63, 63, 70, 0.4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-zinc-400">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <p className="text-zinc-300 text-sm font-medium">No tokens yet</p>
        <p className="text-zinc-500 text-xs max-w-[200px] leading-relaxed">
          Receive tokens or connect to a dApp to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {assets.map(asset => (
        <AssetRow key={asset.symbol} asset={asset} />
      ))}
    </div>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  return (
    <button
      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-150 text-left group"
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(39, 39, 42, 0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Token icon */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{ background: asset.iconColor }}
        >
          {asset.symbol.slice(0, 2)}
        </div>
        {asset.verified && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: '#6366f1' }}
          >
            <svg width="7" height="7" viewBox="0 0 8 8" fill="white">
              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        )}
      </div>

      {/* Token info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-zinc-200 text-sm font-medium leading-none">{asset.name}</p>
          {asset.verified && (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="#6366f1" className="flex-shrink-0">
              <circle cx="6" cy="6" r="6" />
              <path d="M3.5 6L5 7.5L8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">{asset.balance} {asset.symbol}</p>
      </div>

      {/* Value */}
      <div className="text-right flex-shrink-0">
        <p className="text-zinc-400 text-sm font-medium">—</p>
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="h-2.5 w-28 rounded skeleton-shimmer" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-10 rounded skeleton-shimmer ml-auto" />
      </div>
    </div>
  );
}

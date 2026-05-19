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
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(171,159,242,0.08)', border: '1px solid rgba(171,159,242,0.14)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-nebula">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v4l2.5 2.5" />
          </svg>
        </div>
        <p className="text-star-muted text-sm font-medium">No tokens yet</p>
        <p className="text-star-dim text-xs max-w-48 leading-relaxed">
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
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-colors text-left
                 hover:bg-void-200"
    >
      {/* Token icon */}
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: asset.iconColor }}
        >
          {asset.symbol.slice(0, 2)}
        </div>
        {asset.verified && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: '#ab9ff2' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        )}
      </div>

      {/* Token info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-star text-sm font-semibold leading-none">{asset.name}</p>
          {asset.verified && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#ab9ff2" className="flex-shrink-0">
              <circle cx="6" cy="6" r="6" />
              <path d="M3.5 6L5 7.5L8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>
        <p className="text-star-dim text-xs mt-0.5">{asset.balance} {asset.symbol}</p>
      </div>

      {/* Value */}
      <div className="text-right flex-shrink-0">
        <p className="text-star-muted text-sm">-</p>
        <p className="text-star-dim text-xs mt-0.5">-</p>
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-10 h-10 rounded-full bg-void-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-20 bg-void-200 rounded animate-pulse" />
        <div className="h-2.5 w-28 bg-void-200 rounded animate-pulse" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3.5 w-10 bg-void-200 rounded animate-pulse" />
        <div className="h-2.5 w-8 bg-void-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

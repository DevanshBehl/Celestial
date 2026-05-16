interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  iconColor: string;
}

interface Props {
  assets?: Asset[];
  loading?: boolean;
}

export default function AssetList({ assets = [], loading = false }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
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
          style={{ background: 'rgba(74,128,160,0.08)', border: '1px solid rgba(74,128,160,0.14)' }}
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
    <div className="flex flex-col gap-1">
      {assets.map(asset => (
        <AssetRow key={asset.symbol} asset={asset} />
      ))}
    </div>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  return (
    <button
      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-void-100 transition-colors text-left"
    >
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
        style={{ background: asset.iconColor }}
      >
        {asset.symbol.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-star text-sm font-medium leading-none">{asset.symbol}</p>
        <p className="text-star-dim text-xs mt-0.5">{asset.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-star text-sm font-medium">
          ${asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-star-dim text-xs mt-0.5">{asset.balance}</p>
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="w-9 h-9 rounded-full bg-void-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 bg-void-200 rounded animate-pulse" />
        <div className="h-2.5 w-24 bg-void-200 rounded animate-pulse" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-14 bg-void-200 rounded animate-pulse" />
        <div className="h-2.5 w-10 bg-void-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

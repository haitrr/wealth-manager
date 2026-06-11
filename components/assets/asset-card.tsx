"use client";

import { History, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asset } from "@/lib/api/assets";
import { formatCurrency } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate",
  stock: "Stock",
  bond: "Bond",
  gold: "Gold",
};

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onRefreshPrice: (asset: Asset) => void;
  onViewHistory: (asset: Asset) => void;
  refreshing?: boolean;
}

export function AssetCard({ asset, onEdit, onRefreshPrice, onViewHistory, refreshing }: AssetCardProps) {
  const canRefresh = asset.type === "stock" || asset.type === "gold";
  const lastPriced = asset.lastPricedAt
    ? new Date(asset.lastPricedAt).toLocaleDateString()
    : null;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{asset.name}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {TYPE_LABELS[asset.type]}
          </span>
        </div>
        <p className="text-base font-semibold mt-0.5">
          {formatCurrency(asset.currentValue, asset.currency)}
          {asset.purchasePrice > 0 && (() => {
            const pct = ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100;
            const sign = pct >= 0 ? "+" : "";
            return (
              <span className={`ml-1.5 text-xs font-normal ${pct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                ({sign}{pct.toFixed(1)}%)
              </span>
            );
          })()}
        </p>
        {lastPriced && (
          <p className="text-[10px] text-muted-foreground">Last priced: {lastPriced}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canRefresh && (
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onRefreshPrice(asset)}
            disabled={refreshing}
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => onViewHistory(asset)}
        >
          <History className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => onEdit(asset)}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    </div>
  );
}

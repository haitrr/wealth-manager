"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetCard } from "@/components/assets/asset-card";
import {
  createAsset,
  deleteAsset,
  getAssets,
  refreshAssetPrice,
  updateAsset,
  Asset,
  AssetType,
} from "@/lib/api/assets";
import { formatCurrency } from "@/lib/utils";

const TYPE_ORDER: AssetType[] = ["real_estate", "stock", "bond", "gold"];
const TYPE_LABELS: Record<AssetType, string> = {
  real_estate: "Real Estate",
  stock: "Stocks",
  bond: "Bonds",
  gold: "Gold",
};

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["assets"] });

  const createMutation = useMutation({ mutationFn: createAsset, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...p }: { id: string } & Parameters<typeof updateAsset>[1]) => updateAsset(id, p),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteAsset, onSuccess: invalidate });

  async function handleRefreshPrice(asset: Asset) {
    setRefreshingId(asset.id);
    setRefreshError(null);
    try {
      await refreshAssetPrice(asset.id);
      invalidate();
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Failed to refresh price");
    } finally {
      setRefreshingId(null);
    }
  }

  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  const byType = TYPE_ORDER.reduce((acc, t) => {
    acc[t] = assets.filter(a => a.type === t);
    return acc;
  }, {} as Record<AssetType, Asset[]>);

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Assets</h1>
          {assets.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(totalValue, "USD")}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => { setEditingAsset(null); setFormOpen(true); }}>
          <Plus className="size-4 mr-1" />Add Asset
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && error && <p className="text-sm text-destructive">Unable to load assets.</p>}
      {refreshError && <p className="text-sm text-destructive mb-2">{refreshError}</p>}

      {!isLoading && !error && assets.length === 0 && (
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-sm font-medium">No assets yet</p>
          <p className="text-sm text-muted-foreground">
            Add real estate, stocks, bonds, or gold to track your wealth.
          </p>
        </div>
      )}

      {!isLoading && !error && assets.length > 0 && (
        <div className="space-y-6">
          {TYPE_ORDER.map(type => {
            const items = byType[type];
            if (items.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {TYPE_LABELS[type]}
                </h2>
                <div className="space-y-2">
                  {items.map(asset => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onEdit={a => { setEditingAsset(a); setFormOpen(true); }}
                      onRefreshPrice={handleRefreshPrice}
                      refreshing={refreshingId === asset.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssetForm
        open={formOpen}
        asset={editingAsset}
        onClose={() => { setFormOpen(false); setEditingAsset(null); }}
        onSubmit={async payload => {
          if (editingAsset) {
            await updateMutation.mutateAsync({ id: editingAsset.id, ...payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
        onDelete={async asset => { await deleteMutation.mutateAsync(asset.id); }}
      />
    </main>
  );
}

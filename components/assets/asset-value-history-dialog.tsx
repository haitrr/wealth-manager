"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addAssetHistoryEntry,
  deleteAssetHistoryEntry,
  getAssetHistory,
} from "@/lib/api/asset-history";
import { Asset } from "@/lib/api/assets";
import { formatCurrency } from "@/lib/utils";

interface AssetValueHistoryDialogProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

export function AssetValueHistoryDialog({ asset, open, onClose }: AssetValueHistoryDialogProps) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [value, setValue] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["asset-history", asset?.id],
    queryFn: () => getAssetHistory(asset!.id),
    enabled: !!asset,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["asset-history", asset?.id] });
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["networth-history"] });
  }

  const addMutation = useMutation({
    mutationFn: (payload: { date: string; value: number }) =>
      addAssetHistoryEntry(asset!.id, payload),
    onSuccess: () => {
      invalidate();
      setDate("");
      setValue("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteAssetHistoryEntry(asset!.id, entryId),
    onSuccess: invalidate,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date || !value) return;
    addMutation.mutate({ date, value: Number(value) });
  }

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{asset.name} — Value History</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Add entry</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                className="text-[16px] md:text-sm"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value ({asset.currency})</Label>
              <Input
                type="number"
                step="any"
                min="0"
                className="text-[16px] md:text-sm"
                value={value}
                onChange={e => setValue(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={addMutation.isPending}>
            Add
          </Button>
          {addMutation.isError && (
            <p className="text-xs text-destructive">
              {addMutation.error instanceof Error
                ? addMutation.error.message
                : "Failed to add entry"}
            </p>
          )}
        </form>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && entries.length === 0 && (
            <p className="text-sm text-muted-foreground">No history entries yet.</p>
          )}
          {entries.map(entry => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="text-sm">{entry.date}</p>
                <p className="text-sm font-medium">
                  {formatCurrency(entry.value, asset.currency)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(entry.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  ExchangeRate,
} from "@/lib/api/exchange-rates";
import { Currency } from "@/lib/api/accounts";

export default function ExchangeRatesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  const { data: exchangeRates = [], isLoading } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: getExchangeRates,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });

  const createMutation = useMutation({ mutationFn: createExchangeRate, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) => updateExchangeRate(id, rate),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteExchangeRate, onSuccess: invalidate });

  function openAdd() {
    setEditingRate(null);
    setFormOpen(true);
  }

  function openEdit(rate: ExchangeRate) {
    setEditingRate(rate);
    setFormOpen(true);
  }

  async function handleSubmit(data: { fromCurrency: Currency; toCurrency: Currency; rate: number }) {
    if (editingRate) {
      await updateMutation.mutateAsync({ id: editingRate.id, rate: data.rate });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">Currency</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="size-4 mr-1" />
          Add
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Set exchange rates to convert transaction amounts when calculating budgets in different currencies.
      </p>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && exchangeRates.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No exchange rates yet. Add one to enable multi-currency budgets.
        </p>
      )}

      {exchangeRates.length > 0 && (
        <div className="rounded-lg border">
          {exchangeRates.map((rate) => (
            <div key={rate.id} className="flex items-center justify-between p-4 border-b last:border-0">
              <div>
                <p className="font-medium">
                  {rate.fromCurrency} → {rate.toCurrency}
                </p>
                <p className="text-sm text-muted-foreground">
                  1 {rate.fromCurrency} = {rate.rate} {rate.toCurrency}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(rate)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(rate.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExchangeRateForm
        open={formOpen}
        exchangeRate={editingRate}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

interface ExchangeRateFormProps {
  open: boolean;
  exchangeRate?: ExchangeRate | null;
  onClose: () => void;
  onSubmit: (data: { fromCurrency: Currency; toCurrency: Currency; rate: number }) => Promise<void>;
}

function ExchangeRateForm({ open, exchangeRate, onClose, onSubmit }: ExchangeRateFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const fromCurrency = (form.elements.namedItem("fromCurrency") as HTMLSelectElement).value as Currency;
    const toCurrency = (form.elements.namedItem("toCurrency") as HTMLSelectElement).value as Currency;
    const rate = parseFloat((form.elements.namedItem("rate") as HTMLInputElement).value);

    if (fromCurrency === toCurrency) {
      setError("From and to currencies must be different");
      setLoading(false);
      return;
    }

    try {
      await onSubmit({ fromCurrency, toCurrency, rate });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exchangeRate ? "Edit Exchange Rate" : "New Exchange Rate"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fromCurrency">From Currency</Label>
              <select
                id="fromCurrency"
                name="fromCurrency"
                defaultValue={exchangeRate?.fromCurrency ?? "USD"}
                disabled={!!exchangeRate}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="USD">USD - US Dollar</option>
                <option value="VND">VND - Vietnamese Dong</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toCurrency">To Currency</Label>
              <select
                id="toCurrency"
                name="toCurrency"
                defaultValue={exchangeRate?.toCurrency ?? "VND"}
                disabled={!!exchangeRate}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="USD">USD - US Dollar</option>
                <option value="VND">VND - Vietnamese Dong</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Exchange Rate</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                step="0.0001"
                min="0.0001"
                placeholder="e.g., 25000 for USD to VND"
                defaultValue={exchangeRate?.rate ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                required
              />
              <p className="text-xs text-muted-foreground">
                How many units of the target currency equal 1 unit of the source currency
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : exchangeRate ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

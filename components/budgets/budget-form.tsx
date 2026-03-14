"use client";

import { useState, FormEvent } from "react";
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
import { Account, Currency } from "@/lib/api/accounts";
import { TransactionCategory } from "@/lib/api/transaction-categories";
import { Budget, BudgetPayload, BudgetPeriod } from "@/lib/api/budgets";

interface BudgetFormProps {
  open: boolean;
  budget?: Budget | null;
  accounts: Account[];
  categories: TransactionCategory[];
  onClose: () => void;
  onSubmit: (data: BudgetPayload) => Promise<void>;
}

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom range" },
];

export function BudgetForm({ open, budget, accounts, categories, onClose, onSubmit }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? "monthly");

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const amount = parseFloat((form.elements.namedItem("amount") as HTMLInputElement).value);
    const currency = (form.elements.namedItem("currency") as HTMLSelectElement).value as Currency;
    const accountId = (form.elements.namedItem("accountId") as HTMLSelectElement).value;
    const categoryId = (form.elements.namedItem("categoryId") as HTMLSelectElement).value;
    const startDate = period === "custom"
      ? (form.elements.namedItem("startDate") as HTMLInputElement).value
      : undefined;
    const endDate = period === "custom"
      ? (form.elements.namedItem("endDate") as HTMLInputElement).value
      : undefined;

    try {
      await onSubmit({
        name,
        amount,
        currency,
        period,
        startDate,
        endDate,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
      });
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
          <DialogTitle>{budget ? "Edit Budget" : "New Budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Monthly Food" defaultValue={budget?.name ?? ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Budget Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={budget?.amount ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                name="currency"
                defaultValue={budget?.currency ?? "USD"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="USD">USD - US Dollar</option>
                <option value="VND">VND - Vietnamese Dong</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <select
                id="period"
                name="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PERIOD_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {period === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={budget?.startDate ? new Date(budget.startDate).toISOString().split("T")[0] : today}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={budget?.endDate ? new Date(budget.endDate).toISOString().split("T")[0] : ""}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <select
                id="accountId"
                name="accountId"
                defaultValue={budget?.accountId ?? ""}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}{a.isDefault ? " (Default)" : ""}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={budget?.categoryId ?? ""}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All expense categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : budget ? "Save Changes" : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

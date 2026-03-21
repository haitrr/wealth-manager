"use client";

import { useState, FormEvent } from "react";
import { Trash2 } from "lucide-react";
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
import { AmountInput } from "@/components/transactions/amount-input";
import { BudgetCategorySelector, BudgetCategoryMode } from "@/components/budgets/budget-category-selector";
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
  onDelete?: (budget: Budget) => Promise<void>;
}

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom range" },
];

export function BudgetForm({ open, budget, accounts, categories, onClose, onSubmit, onDelete }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? "monthly");

  const initialMode: BudgetCategoryMode =
    budget?.excludedCategoryIds?.length ? "exclude" :
    budget?.categoryIds?.length ? "include" : "all";
  const initialIds =
    budget?.excludedCategoryIds?.length ? budget.excludedCategoryIds :
    budget?.categoryIds?.length ? budget.categoryIds : [];
  const [categoryMode, setCategoryMode] = useState<BudgetCategoryMode>(initialMode);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialIds);

  const today = new Date().toISOString().split("T")[0];
  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const amount = parseFloat((form.elements.namedItem("amount") as HTMLInputElement).value.replace(/,/g, ""));
    const currency = (form.elements.namedItem("currency") as HTMLSelectElement).value as Currency;
    const accountId = (form.elements.namedItem("accountId") as HTMLSelectElement).value;
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
        categoryIds: categoryMode === "include" && selectedCategoryIds.length ? selectedCategoryIds : undefined,
        excludedCategoryIds: categoryMode === "exclude" && selectedCategoryIds.length ? selectedCategoryIds : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmDelete(false); onClose(); } }}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "New Budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Monthly Food" defaultValue={budget?.name ?? ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Budget Amount</Label>
              <AmountInput defaultValue={budget?.amount} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                name="currency"
                defaultValue={budget?.currency ?? defaultAccount?.currency ?? "USD"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}{a.isDefault ? " (Default)" : ""}</option>
                ))}
              </select>
            </div>

            <BudgetCategorySelector
              categories={categories}
              mode={categoryMode}
              selectedIds={selectedCategoryIds}
              onModeChange={setCategoryMode}
              onSelectedIdsChange={setSelectedCategoryIds}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-4">
            <div className="flex items-center justify-between w-full gap-2">
              <div>
                {budget && onDelete && (
                  confirmDelete ? (
                    <p className="text-sm text-destructive">Delete this budget?</p>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive"
                      onClick={() => setConfirmDelete(true)}
                      disabled={loading}
                    >
                      <Trash2 className="size-4 mr-1" />
                      Delete
                    </Button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                {confirmDelete ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onDelete!(budget!);
                          onClose();
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {loading ? "Deleting…" : "Confirm Delete"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving…" : budget ? "Save Changes" : "Create Budget"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

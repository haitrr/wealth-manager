"use client";

import { useState, useEffect, FormEvent } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AmountInput } from "@/components/transactions/amount-input";
import { CategorySelector } from "@/components/transactions/category-selector";
import { Transaction } from "@/lib/api/transactions";
import { Account } from "@/lib/api/accounts";
import { TransactionCategory } from "@/lib/api/transaction-categories";

interface TransactionFieldsProps {
  transaction?: Transaction | null;
  accounts: Account[];
  categories: TransactionCategory[];
  defaultDate: string;
  defaultAccountId: string;
  error: string;
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
}

function TransactionFields({
  transaction,
  accounts,
  categories,
  defaultDate,
  defaultAccountId,
  error,
  selectedCategoryId,
  onCategoryChange,
}: TransactionFieldsProps) {
  const [date, setDate] = useState(defaultDate);

  function shiftDate(days: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <AmountInput defaultValue={transaction?.amount} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shiftDate(-1)} className="relative z-10 flex items-center justify-center size-10 rounded-lg border border-input bg-background hover:bg-accent shrink-0">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex h-9 flex-1 items-center rounded-md border border-input bg-background px-3 shadow-sm gap-2">
            <span className="text-muted-foreground text-sm shrink-0">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <input
              id="date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="flex-1 bg-transparent outline-none text-[16px] md:text-sm min-w-0"
            />
          </div>
          <button type="button" onClick={() => shiftDate(1)} className="relative z-10 flex items-center justify-center size-10 rounded-lg border border-input bg-background hover:bg-accent shrink-0">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <CategorySelector
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={onCategoryChange}
      />

      <div className="space-y-2">
        <Label htmlFor="accountId">Account</Label>
        <select
          id="accountId"
          name="accountId"
          defaultValue={transaction?.accountId ?? defaultAccountId}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
              {account.isDefault ? " (Default)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Add a note…"
          defaultValue={transaction?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">Details (optional)</Label>
        <textarea
          id="details"
          name="details"
          placeholder="Item list, receipt details…"
          defaultValue={transaction?.details ?? ""}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface TransactionFormProps {
  open: boolean;
  transaction?: Transaction | null;
  accounts: Account[];
  categories: TransactionCategory[];
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    date: string;
    description?: string;
    details?: string;
    accountId: string;
    categoryId: string;
  }) => Promise<void>;
  onDelete?: (transaction: Transaction) => Promise<void>;
}

export function TransactionForm({
  open,
  transaction,
  accounts,
  categories,
  onClose,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    transaction?.categoryId ?? ""
  );

  useEffect(() => {
    setSelectedCategoryId(transaction?.categoryId ?? "");
  }, [transaction?.id]);

  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const amount = parseFloat((form.elements.namedItem("amount") as HTMLInputElement).value.replace(/,/g, ""));
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value;
    const details = (form.elements.namedItem("details") as HTMLTextAreaElement).value;
    const accountId = (form.elements.namedItem("accountId") as HTMLSelectElement).value;
    const categoryId = selectedCategoryId;

    if (!categoryId) {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

    try {
      await onSubmit({ amount, date, description: description || undefined, details: details || undefined, accountId, categoryId });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const defaultDate = transaction
    ? new Date(transaction.date).toISOString().split("T")[0]
    : today;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmDelete(false); onClose(); } }}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <TransactionFields
            key={transaction?.id ?? "new"}
            transaction={transaction}
            accounts={accounts}
            categories={categories}
            defaultDate={defaultDate}
            defaultAccountId={defaultAccount?.id ?? ""}
            error={error}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
          />
          <div className="flex items-center justify-between pt-4 gap-2">
            <div>
              {transaction && onDelete && (
                confirmDelete ? (
                  <p className="text-sm text-destructive">Delete this transaction?</p>
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
                        await onDelete!(transaction!);
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
                    {loading ? "Saving…" : transaction ? "Save Changes" : "Add Transaction"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

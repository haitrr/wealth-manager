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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Transaction } from "@/lib/api/transactions";
import { Account } from "@/lib/api/accounts";
import { TransactionCategory, CategoryType } from "@/lib/api/transaction-categories";

const TAB_TYPES: { value: CategoryType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "payable", label: "Payable" },
  { value: "receivable", label: "Receivable" },
];

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
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const defaultTab = selectedCategory?.type ?? "expense";
  const [activeTab, setActiveTab] = useState<CategoryType>(defaultTab);

  function handleTabChange(tab: string) {
    setActiveTab(tab as CategoryType);
    onCategoryChange("");
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          defaultValue={transaction?.amount ?? ""}
          onKeyDown={(e) => e.key === "-" && e.preventDefault()}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {TAB_TYPES.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="flex-1">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TAB_TYPES.map(({ value: type }) => (
            <TabsContent key={type} value={type} className="mt-2">
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {categories.filter((c) => c.type === type).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange(cat.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      selectedCategoryId === cat.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountId">Account</Label>
        <select
          id="accountId"
          name="accountId"
          defaultValue={transaction?.accountId ?? defaultAccountId}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
    accountId: string;
    categoryId: string;
  }) => Promise<void>;
}

export function TransactionForm({
  open,
  transaction,
  accounts,
  categories,
  onClose,
  onSubmit,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    transaction?.categoryId ?? ""
  );

  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const amount = parseFloat((form.elements.namedItem("amount") as HTMLInputElement).value);
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value;
    const accountId = (form.elements.namedItem("accountId") as HTMLSelectElement).value;
    const categoryId = selectedCategoryId;

    try {
      await onSubmit({ amount, date, description: description || undefined, accountId, categoryId });
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <TransactionFields
            transaction={transaction}
            accounts={accounts}
            categories={categories}
            defaultDate={defaultDate}
            defaultAccountId={defaultAccount?.id ?? ""}
            error={error}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
          />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : transaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

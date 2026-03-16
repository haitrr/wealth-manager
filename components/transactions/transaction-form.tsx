"use client";

import { useState, FormEvent, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AmountInput } from "@/components/transactions/amount-input";
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
  const [date, setDate] = useState(defaultDate);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    const q = categoryFilter.trim().toLowerCase();
    if (!q) return null;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categoryFilter]);

  function shiftDate(days: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab as CategoryType);
    onCategoryChange("");
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Category</Label>
          <button
            type="button"
            onClick={() => {
              if (filterOpen) {
                setFilterOpen(false);
                setCategoryFilter("");
              } else {
                setFilterOpen(true);
                setTimeout(() => filterInputRef.current?.focus(), 0);
              }
            }}
            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {filterOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
        </div>
        {filterOpen && (
          <input
            ref={filterInputRef}
            type="text"
            placeholder="Filter categories…"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        )}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {TAB_TYPES.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="flex-1">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="h-48 mt-2 overflow-y-auto">
            {TAB_TYPES.map(({ value: type }) => {
              const typeCategories = categories.filter((c) => c.type === type);
              const visibleCategories = filteredCategories
                ? filteredCategories.filter((c) => c.type === type)
                : typeCategories;
              const roots = visibleCategories.filter((c) => !c.parentId);
              const childrenOf = (parentId: string) =>
                visibleCategories.filter((c) => c.parentId === parentId);
              const orphanChildren = filteredCategories
                ? visibleCategories.filter(
                    (c) => c.parentId && !visibleCategories.find((p) => p.id === c.parentId)
                  )
                : [];

              return (
                <div key={type} className={cn("space-y-2", activeTab !== type && "hidden")}>
                  {visibleCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories found.</p>
                  ) : (
                    <>
                      {roots.map((root) => {
                        const children = childrenOf(root.id);
                        return (
                          <div key={root.id}>
                            {children.length > 0 ? (
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => onCategoryChange(root.id)}
                                  className={cn(
                                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                                    selectedCategoryId === root.id
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input hover:bg-accent"
                                  )}
                                >
                                  {root.name}
                                </button>
                                <div className="flex flex-wrap gap-2 pl-3 border-l-2 border-muted ml-2">
                                  {children.map((child) => (
                                    <button
                                      key={child.id}
                                      type="button"
                                      onClick={() => onCategoryChange(child.id)}
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-sm transition-colors",
                                        selectedCategoryId === child.id
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-input hover:bg-accent"
                                      )}
                                    >
                                      {child.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onCategoryChange(root.id)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-sm transition-colors",
                                  selectedCategoryId === root.id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input hover:bg-accent"
                                )}
                              >
                                {root.name}
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {orphanChildren.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {orphanChildren.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => onCategoryChange(child.id)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-sm transition-colors",
                                selectedCategoryId === child.id
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input hover:bg-accent"
                              )}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Tabs>
      </div>

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

  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const amount = parseFloat((form.elements.namedItem("amount") as HTMLInputElement).value.replace(/,/g, ""));
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value;
    const accountId = (form.elements.namedItem("accountId") as HTMLSelectElement).value;
    const categoryId = selectedCategoryId;

    if (!categoryId) {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

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
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmDelete(false); onClose(); } }}>
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

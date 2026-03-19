"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { ImportDialog } from "@/components/transactions/import-dialog";
import { TransactionSearch } from "@/components/transactions/transaction-search";
import {
  TimeRangeSelector,
  TimeRange,
  getDateRange,
} from "@/components/transactions/time-range-selector";
import {
  Transaction,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/api/transactions";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("this-month");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const dateRange = getDateRange(timeRange);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", debouncedSearch ? { search: debouncedSearch } : { timeRange }],
    queryFn: () =>
      debouncedSearch
        ? getTransactions({ search: debouncedSearch })
        : getTransactions(dateRange),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["transactions"] });

  const createMutation = useMutation({ mutationFn: createTransaction, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteTransaction, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      amount: number;
      date: string;
      description?: string;
      accountId: string;
      categoryId: string;
    }) => updateTransaction(id, data),
    onSuccess: invalidate,
  });

  function openAdd() {
    setEditingTransaction(null);
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  async function handleSubmit(data: {
    amount: number;
    date: string;
    description?: string;
    accountId: string;
    categoryId: string;
  }) {
    if (editingTransaction) {
      await updateMutation.mutateAsync({ id: editingTransaction.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  // Group transactions by day
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = new Date(tx.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="size-4 mr-1" />
          Import
        </Button>
      </div>

      {!debouncedSearch && (
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      )}

      <TransactionSearch onSearch={setDebouncedSearch} />

      {isLoading && <p className="text-muted-foreground text-sm mt-4">Loading…</p>}

      {!isLoading && transactions.length === 0 && !debouncedSearch && (
        <p className="text-muted-foreground text-sm mt-4">
          No transactions yet. Add one to get started.
        </p>
      )}

      {!isLoading && transactions.length === 0 && debouncedSearch && (
        <p className="text-muted-foreground text-sm mt-4">No transactions match your search.</p>
      )}

      <div className="space-y-6 mt-6">
        {Object.entries(grouped).map(([day, txs]) => (
          <div key={day}>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">{day}</h2>
            <div className="rounded-lg border px-4">
              {txs.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        size="icon"
        className="fixed right-6 size-14 rounded-full shadow-lg"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        onClick={openAdd}
        disabled={accounts.length === 0 || categories.length === 0}
        aria-label="Add transaction"
      >
        <Plus className="size-6" />
      </Button>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <TransactionForm
        open={formOpen}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={async (t) => { await deleteMutation.mutateAsync(t.id); }}
      />
    </main>
  );
}

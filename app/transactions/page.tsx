"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { ImportDialog } from "@/components/transactions/import-dialog";
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

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
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
  const deleteMutation = useMutation({ mutationFn: deleteTransaction, onSuccess: invalidate });

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

  // Group transactions by month
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = new Date(tx.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="size-4 mr-1" />
            Import
          </Button>
          <Button onClick={openAdd} size="sm" disabled={accounts.length === 0 || categories.length === 0}>
            <Plus className="size-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && transactions.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No transactions yet. Add one to get started.
        </p>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([month, txs]) => (
          <div key={month}>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">{month}</h2>
            <div className="rounded-lg border px-4">
              {txs.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={openEdit}
                  onDelete={(t) => deleteMutation.mutate(t.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <TransactionForm
        open={formOpen}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

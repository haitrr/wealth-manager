"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetBurnDownChart } from "@/components/budgets/budget-burn-down-chart";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { getBudget, updateBudget, deleteBudget, getBudgetTransactions, BudgetPayload } from "@/lib/api/budgets";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";
import { Transaction, updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatCurrency } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = { monthly: "Monthly", yearly: "Yearly", custom: "Custom" };

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txFormOpen, setTxFormOpen] = useState(false);

  const { data: budget, isLoading } = useQuery({ queryKey: ["budgets", id], queryFn: () => getBudget(id) });
  const { data: transactions = [] } = useQuery({ queryKey: ["budget-transactions", id], queryFn: () => getBudgetTransactions(id), enabled: !!budget });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const { data: categories = [] } = useQuery({ queryKey: ["transaction-categories"], queryFn: getTransactionCategories });

  const invalidateBudget = () => {
    queryClient.invalidateQueries({ queryKey: ["budgets", id] });
    queryClient.invalidateQueries({ queryKey: ["budget-transactions", id] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const updateMutation = useMutation({ mutationFn: (data: BudgetPayload) => updateBudget(id, data), onSuccess: invalidateBudget });
  const deleteMutation = useMutation({
    mutationFn: () => deleteBudget(id),
    onSuccess: () => router.push("/budgets"),
  });
  const updateTxMutation = useMutation({
    mutationFn: ({ txId, ...data }: { txId: string } & Parameters<typeof updateTransaction>[1]) =>
      updateTransaction(txId, data),
    onSuccess: invalidateBudget,
  });
  const deleteTxMutation = useMutation({
    mutationFn: (txId: string) => deleteTransaction(txId),
    onSuccess: invalidateBudget,
  });

  function openEditTx(tx: Transaction) {
    setEditingTx(tx);
    setTxFormOpen(true);
  }

  if (isLoading) {
    return <main className="max-w-lg mx-auto px-4 py-8"><p className="text-muted-foreground text-sm">Loading…</p></main>;
  }
  if (!budget) {
    return <main className="max-w-lg mx-auto px-4 py-8"><p className="text-destructive text-sm">Budget not found.</p></main>;
  }

  const percent = Math.min(100, budget.percentUsed);
  const isOver = budget.spent > budget.amount;
  const currency = budget.currency;
  const periodStart = new Date(budget.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const periodEnd = new Date(budget.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/budgets" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1 truncate">{budget.name}</h1>
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}><Pencil className="size-4" /></Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate()}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Meta */}
      <p className="text-sm text-muted-foreground mb-4">
        {PERIOD_LABELS[budget.period]}
        {budget.account ? ` · ${budget.account.name}` : " · All accounts"}
        {budget.category ? ` · ${budget.category.name}` : " · All expense categories"}
        <br />
        {periodStart} – {periodEnd}
      </p>

      {/* Progress */}
      <div className="rounded-lg border p-4 space-y-3 mb-6">
        <div className="flex justify-between text-sm font-medium">
          <span>{formatCurrency(budget.spent, currency)} spent</span>
          <span className="text-muted-foreground">{formatCurrency(budget.amount, currency)}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percent.toFixed(1)}% used</span>
          <span className={isOver ? "text-destructive font-medium" : ""}>
            {isOver ? `${formatCurrency(Math.abs(budget.remaining), currency)} over` : `${formatCurrency(budget.remaining, currency)} remaining`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Days elapsed</p>
            <p className="text-sm font-medium">{budget.daysElapsed}</p>
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Avg/day</p>
            <p className="text-sm font-medium">{formatCurrency(budget.avgSpentPerDay, currency)}</p>
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              {budget.daysRemaining > 0 ? `${budget.daysRemaining}d left` : "Ended"}
            </p>
            <p className={`text-sm font-medium ${budget.suggestedDailySpend < 0 ? "text-destructive" : ""}`}>
              {budget.daysRemaining > 0 ? `${formatCurrency(Math.max(0, budget.suggestedDailySpend), currency)}/day` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Burn Down Chart */}
      <BudgetBurnDownChart
        periodStart={budget.periodStart}
        periodEnd={budget.periodEnd}
        budgetAmount={budget.amount}
        currency={currency}
        transactions={transactions}
      />

      {/* Transactions */}
      <h2 className="text-sm font-medium text-muted-foreground mb-2 mt-6">Transactions this period</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transactions for this budget period.</p>
      ) : (
        <div className="rounded-lg border px-4">
          {transactions.map((tx: Transaction) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              onEdit={openEditTx}
              onDelete={(t) => deleteTxMutation.mutate(t.id)}
            />
          ))}
        </div>
      )}

      <BudgetForm
        open={editOpen}
        budget={budget}
        accounts={accounts}
        categories={categories}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
      />

      <TransactionForm
        open={txFormOpen}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
        onClose={() => setTxFormOpen(false)}
        onSubmit={async (data) => {
          if (editingTx) await updateTxMutation.mutateAsync({ txId: editingTx.id, ...data });
        }}
      />
    </main>
  );
}

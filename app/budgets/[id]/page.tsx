"use client";

import { use, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths, addMonths, subYears, addYears } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetBurnDownChart } from "@/components/budgets/budget-burn-down-chart";
import { BudgetCategoryPieChart } from "@/components/budgets/budget-category-pie-chart";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { getBudget, updateBudget, deleteBudget, getBudgetTransactions, BudgetPayload } from "@/lib/api/budgets";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";
import { Transaction, updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatCurrency } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = { monthly: "Monthly", yearly: "Yearly", custom: "Custom" };

function formatPeriodParam(date: Date, period: string): string {
  if (period === "monthly") return format(date, "yyyy-MM");
  if (period === "yearly") return format(date, "yyyy");
  return "";
}

function parsePeriodParamClient(value: string | null, period: string): Date {
  if (value && period === "monthly") {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 15);
  }
  if (value && period === "yearly") {
    const match = /^(\d{4})$/.exec(value);
    if (match) return new Date(parseInt(match[1]), 6, 1);
  }
  return new Date();
}

function BudgetDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txFormOpen, setTxFormOpen] = useState(false);

  const dateParam = searchParams.get("date");

  const { data: budget, isLoading } = useQuery({
    queryKey: ["budgets", id, dateParam],
    queryFn: () => getBudget(id, dateParam ?? undefined),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["budget-transactions", id, dateParam],
    queryFn: () => getBudgetTransactions(id, dateParam ?? undefined),
    enabled: !!budget,
  });

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const { data: categories = [] } = useQuery({ queryKey: ["transaction-categories"], queryFn: getTransactionCategories });

  const invalidateBudget = () => {
    queryClient.invalidateQueries({ queryKey: ["budgets", id] });
    queryClient.invalidateQueries({ queryKey: ["budget-transactions", id] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const updateMutation = useMutation({ mutationFn: (data: BudgetPayload) => updateBudget(id, data), onSuccess: invalidateBudget });
  const updateTxMutation = useMutation({
    mutationFn: ({ txId, ...data }: { txId: string } & Parameters<typeof updateTransaction>[1]) =>
      updateTransaction(txId, data),
    onSuccess: invalidateBudget,
  });
  const deleteTxMutation = useMutation({
    mutationFn: (txId: string) => deleteTransaction(txId),
    onSuccess: invalidateBudget,
  });

  const viewDate = useMemo(
    () => parsePeriodParamClient(dateParam, budget?.period ?? "monthly"),
    [dateParam, budget?.period]
  );

  const prevParam = useMemo(() => {
    if (!budget || budget.period === "custom") return null;
    const prev = budget.period === "monthly" ? subMonths(viewDate, 1) : subYears(viewDate, 1);
    return formatPeriodParam(prev, budget.period);
  }, [viewDate, budget]);

  const nextParam = useMemo(() => {
    if (!budget || budget.period === "custom") return null;
    const next = budget.period === "monthly" ? addMonths(viewDate, 1) : addYears(viewDate, 1);
    return formatPeriodParam(next, budget.period);
  }, [viewDate, budget]);

  const isCurrentPeriod = useMemo(() => {
    if (!budget || budget.period === "custom") return true;
    const currentParam = formatPeriodParam(new Date(), budget.period);
    return !dateParam || dateParam === currentParam;
  }, [dateParam, budget]);

  function navigate(param: string | null) {
    if (!param) return;
    const url = new URL(window.location.href);
    url.searchParams.set("date", param);
    router.push(url.pathname + url.search);
  }

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
      </div>

      {/* Meta */}
      <p className="text-sm text-muted-foreground mb-1">
        {PERIOD_LABELS[budget.period]}
        {budget.account ? ` · ${budget.account.name}` : " · All accounts"}
        {budget.categories.length > 0
          ? ` · ${budget.categories.map((c) => c.name).join(", ")}`
          : budget.excludedCategories.length > 0
          ? ` · All except ${budget.excludedCategories.map((c) => c.name).join(", ")}`
          : " · All expense categories"}
      </p>

      {/* Period navigation */}
      {budget.period !== "custom" ? (
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => navigate(prevParam)}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            aria-label="Previous period"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm">{periodStart} – {periodEnd}</span>
          <button
            onClick={() => navigate(nextParam)}
            disabled={isCurrentPeriod}
            className="text-muted-foreground hover:text-foreground p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next period"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-1">{periodStart} – {periodEnd}</p>
      )}

      {!isCurrentPeriod && (
        <p className="text-xs text-muted-foreground mb-4">Past period</p>
      )}
      {isCurrentPeriod && <div className="mb-4" />}

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

      {/* Category Breakdown */}
      <BudgetCategoryPieChart
        transactions={transactions}
        categories={categories}
        currency={currency}
      />

      {/* Transactions */}
      <h2 className="text-sm font-medium text-muted-foreground mb-2 mt-6">Transactions this period</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transactions for this budget period.</p>
      ) : (
        <div className="space-y-4">
          {(Object.entries(
            transactions.reduce((groups: Record<string, Transaction[]>, tx: Transaction) => {
              const d = new Date(tx.date);
              const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              (groups[day] ??= []).push(tx);
              return groups;
            }, {} as Record<string, Transaction[]>)
          ) as [string, Transaction[]][])
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, txs]) => (
              <div key={day}>
                <p className="text-xs text-muted-foreground mb-1 px-1">
                  {new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <div className="rounded-lg border px-4">
                  {txs.map((tx) => (
                    <TransactionRow key={tx.id} transaction={tx} onEdit={openEditTx} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <BudgetForm
        open={editOpen}
        budget={budget}
        accounts={accounts}
        categories={categories}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => { await updateMutation.mutateAsync(data); }}
        onDelete={async () => { await deleteBudget(id); router.push("/budgets"); }}
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
        onDelete={async (t) => { await deleteTxMutation.mutateAsync(t.id); setTxFormOpen(false); }}
      />
    </main>
  );
}

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<main className="max-w-lg mx-auto px-4 py-8"><p className="text-muted-foreground text-sm">Loading…</p></main>}>
      <BudgetDetailContent id={id} />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BalanceTrendChart } from "@/components/dashboard/balance-trend-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { createTransaction } from "@/lib/api/transactions";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";
import { getExchangeRates } from "@/lib/api/exchange-rates";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/axios";

interface DailyData {
  date: string;
  balance: number;
  income: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  amount: number;
}

interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  month: string;
  dailyData: DailyData[];
  incomeByCategory: CategoryData[];
  expensesByCategory: CategoryData[];
}

type TimeRange = "this_month" | "last_month" | "this_year";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
];

function getDateRange(range: TimeRange): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (range) {
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default: // this_month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return {
    startDate: fmt(start),
    endDate: fmt(end),
  };
}

async function getMonthlySummary(range: TimeRange): Promise<MonthlySummary> {
  const { startDate, endDate } = getDateRange(range);
  const { data } = await api.get<MonthlySummary>("/transactions/summary", {
    params: { startDate, endDate },
  });
  return data;
}

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["transactions-summary", timeRange],
    queryFn: () => getMonthlySummary(timeRange),
  });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const { data: exchangeRates = [] } = useQuery({ queryKey: ["exchange-rates"], queryFn: getExchangeRates });
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  // Use default account's currency or fallback to USD
  const defaultAccount = accounts.find(acc => acc.isDefault);
  const currency = defaultAccount?.currency ?? accounts[0]?.currency ?? "USD";

  // Total balance across all accounts converted to default currency
  const totalBalance = accounts.reduce((sum, account) => {
    if (account.currency === currency) return sum + account.balance;
    const rate = exchangeRates.find(
      r => r.fromCurrency === account.currency && r.toCurrency === currency
    );
    if (rate) return sum + account.balance * rate.rate;
    const inverseRate = exchangeRates.find(
      r => r.fromCurrency === currency && r.toCurrency === account.currency
    );
    if (inverseRate) return sum + account.balance / inverseRate.rate;
    return sum + account.balance; // fallback: no conversion
  }, 0);

  return (
    <main className="max-w-lg mx-auto px-4 py-4">
<div className="mb-2 rounded-xl bg-linear-to-br from-indigo-950 to-violet-950 px-4 py-3 text-white">
        <p className="text-xs opacity-70">Total Balance</p>
        <p className="text-2xl font-bold tracking-tight">
          {accounts.length > 0 ? formatCurrency(totalBalance, currency) : "—"}
        </p>
      </div>

      <div className="mb-3 flex w-full justify-start">
        <div className="flex gap-1">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                timeRange === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {summary && (
        <div className="space-y-2">
          <Card>
            <CardContent className="grid grid-cols-3 divide-x p-0">
              <div className="flex flex-col items-center py-2 px-1">
                <p className="text-[10px] text-muted-foreground">Net</p>
                <p className={`text-sm font-semibold ${summary.netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(summary.netBalance, currency)}
                </p>
              </div>
              <div className="flex flex-col items-center py-2 px-1">
                <p className="text-[10px] text-muted-foreground">Income</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.totalIncome, currency)}
                </p>
              </div>
              <div className="flex flex-col items-center py-2 px-1">
                <p className="text-[10px] text-muted-foreground">Expenses</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.totalExpenses, currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <BudgetOverview />

          {/* Balance Trend Chart */}
          <BalanceTrendChart dailyData={summary.dailyData} currency={currency} />

          {/* Category Pie Charts */}
          <div className="grid grid-cols-1 gap-3">
            <CategoryPieChart
              title="Expenses by Category"
              data={summary.expensesByCategory}
              currency={currency}
            />
            <CategoryPieChart
              title="Income by Category"
              data={summary.incomeByCategory}
              currency={currency}
            />
          </div>
        </div>
      )}

      <Button
        size="icon"
        className="fixed right-6 size-14 rounded-full shadow-lg"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        onClick={() => setFormOpen(true)}
        aria-label="Add transaction"
      >
        <Plus className="size-6" />
      </Button>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        accounts={accounts}
        categories={categories}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
          router.push("/transactions");
        }}
      />
    </main>
  );
}

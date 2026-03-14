"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Plus, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { createTransaction } from "@/lib/api/transactions";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/axios";

interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  month: string;
}

async function getMonthlySummary(): Promise<MonthlySummary> {
  const { data } = await api.get<MonthlySummary>("/transactions/summary");
  return data;
}

export default function Home() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["transactions-summary"],
    queryFn: getMonthlySummary,
  });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
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

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {summary && (
          <p className="text-sm text-muted-foreground mt-0.5">{summary.month}</p>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {summary && (
        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Wallet className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p
                  className={`text-xl font-semibold ${
                    summary.netBalance >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(summary.netBalance, currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 shrink-0">
                  <ArrowUpRight className="size-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.totalIncome, currency)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                  <ArrowDownRight className="size-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(summary.totalExpenses, currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Button
        size="icon"
        className="fixed bottom-20 right-6 size-14 rounded-full shadow-lg"
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
        }}
      />
    </main>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetPayload, BudgetPeriod, getBudgets, createBudget } from "@/lib/api/budgets";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");

  const { data: budgets = [], isLoading } = useQuery({ queryKey: ["budgets"], queryFn: getBudgets });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const { data: categories = [] } = useQuery({ queryKey: ["transaction-categories"], queryFn: getTransactionCategories });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["budgets"] });
  const createMutation = useMutation({ mutationFn: createBudget, onSuccess: invalidate });

  async function handleSubmit(data: BudgetPayload) {
    await createMutation.mutateAsync(data);
  }

  const filtered = budgets.filter((b) => b.period === period);

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
          <TabsTrigger value="yearly" className="flex-1">Yearly</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No {period} budgets yet. Create one to start tracking your spending.
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>

      <Button
        size="icon"
        className="fixed right-6 size-14 rounded-full shadow-lg"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        onClick={() => setFormOpen(true)}
        aria-label="Add budget"
      >
        <Plus className="size-6" />
      </Button>

      <BudgetForm
        open={formOpen}
        accounts={accounts}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

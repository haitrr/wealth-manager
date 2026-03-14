"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import {
  Budget,
  BudgetPayload,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/lib/api/budgets";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactionCategories } from "@/lib/api/transaction-categories";

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const { data: budgets = [], isLoading } = useQuery({ queryKey: ["budgets"], queryFn: getBudgets });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const { data: categories = [] } = useQuery({ queryKey: ["transaction-categories"], queryFn: getTransactionCategories });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["budgets"] });

  const createMutation = useMutation({ mutationFn: createBudget, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & BudgetPayload) => updateBudget(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteBudget, onSuccess: invalidate });

  function openAdd() {
    setEditingBudget(null);
    setFormOpen(true);
  }

  function openEdit(budget: Budget) {
    setEditingBudget(budget);
    setFormOpen(true);
  }

  async function handleSubmit(data: BudgetPayload) {
    if (editingBudget) {
      await updateMutation.mutateAsync({ id: editingBudget.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="size-4 mr-1" />
          Add
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && budgets.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No budgets yet. Create one to start tracking your spending.
        </p>
      )}

      <div className="space-y-3">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={openEdit}
            onDelete={(b) => deleteMutation.mutate(b.id)}
          />
        ))}
      </div>

      <BudgetForm
        open={formOpen}
        budget={editingBudget}
        accounts={accounts}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

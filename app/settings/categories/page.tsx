"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/transaction-categories/category-card";
import { CategoryForm } from "@/components/transaction-categories/category-form";
import {
  TransactionCategory,
  CategoryType,
  getTransactionCategories,
  createTransactionCategory,
  updateTransactionCategory,
  deleteTransactionCategory,
} from "@/lib/api/transaction-categories";

export default function CategoriesSettingsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });

  const createMutation = useMutation({ mutationFn: createTransactionCategory, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; type: CategoryType }) =>
      updateTransactionCategory(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteTransactionCategory, onSuccess: invalidate });

  function openAdd() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function openEdit(category: TransactionCategory) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  async function handleSubmit(data: { name: string; type: CategoryType }) {
    if (editingCategory) {
      await updateMutation.mutateAsync({ id: editingCategory.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  const grouped = categories.reduce<Record<string, TransactionCategory[]>>((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {});

  const typeOrder = ["income", "expense", "payable", "receivable"];
  const typeLabels: Record<string, string> = {
    income: "Income",
    expense: "Expense",
    payable: "Payable (Borrowed)",
    receivable: "Receivable (Lent)",
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="size-4 mr-1" />
          Add Category
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && categories.length === 0 && (
        <p className="text-muted-foreground text-sm">No categories yet. Add one to get started.</p>
      )}

      <div className="space-y-6">
        {typeOrder
          .filter((t) => grouped[t]?.length)
          .map((type) => (
            <div key={type}>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">{typeLabels[type]}</h2>
              <div className="space-y-2">
                {grouped[type].map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEdit}
                    onDelete={(c) => deleteMutation.mutate(c.id)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      <CategoryForm
        open={formOpen}
        category={editingCategory}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

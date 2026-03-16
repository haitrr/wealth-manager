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

const typeOrder = ["income", "expense", "payable", "receivable"];
const typeLabels: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  payable: "Payable (Borrowed)",
  receivable: "Receivable (Lent)",
};

export default function CategoriesSettingsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });

  const createMutation = useMutation({ mutationFn: createTransactionCategory, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; type: CategoryType; parentId?: string | null }) =>
      updateTransactionCategory(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteTransactionCategory, onSuccess: invalidate });

  function openAdd(parentId?: string | null) {
    setEditingCategory(null);
    setDefaultParentId(parentId ?? null);
    setFormOpen(true);
  }

  function openEdit(category: TransactionCategory) {
    setEditingCategory(category);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  async function handleSubmit(data: { name: string; type: CategoryType; parentId?: string | null }) {
    if (editingCategory) {
      await updateMutation.mutateAsync({ id: editingCategory.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  // Root categories (no parent)
  const rootCategories = categories.filter((c) => !c.parentId);
  // Only root categories can be parents in the form
  const parentCategories = editingCategory
    ? rootCategories.filter((c) => c.id !== editingCategory.id)
    : rootCategories;

  const grouped = rootCategories.reduce<Record<string, TransactionCategory[]>>((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {});

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button onClick={() => openAdd()} size="sm">
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
                {grouped[type].map((category) => {
                  const children = categories.filter((c) => c.parentId === category.id);
                  return (
                    <div key={category.id}>
                      <CategoryCard
                        category={category}
                        onEdit={openEdit}
                        onAddSubcategory={() => openAdd(category.id)}
                      />
                      {children.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                          {children.map((child) => (
                            <CategoryCard
                              key={child.id}
                              category={child}
                              onEdit={openEdit}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      <CategoryForm
        open={formOpen}
        category={editingCategory}
        parentCategories={parentCategories}
        defaultParentId={defaultParentId}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={(c) => deleteMutation.mutateAsync(c.id)}
      />
    </main>
  );
}

"use client";

import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionCategory, CategoryType } from "@/lib/api/transaction-categories";
import { CategoryIcon } from "./category-icon";

const TYPE_COLORS: Record<CategoryType, string> = {
  income: "bg-green-500/10 text-green-600 dark:text-green-400",
  expense: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const TYPE_LABELS: Record<CategoryType, string> = {
  income: "Income",
  expense: "Expense",
};

interface CategoryCardProps {
  category: TransactionCategory;
  onEdit: (category: TransactionCategory) => void;
  onAddSubcategory?: () => void;
}

export function CategoryCard({ category, onEdit, onAddSubcategory }: CategoryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <CategoryIcon icon={category.icon} size={18} className="text-muted-foreground shrink-0" />
          <p className="font-medium truncate">{category.name}</p>
          {!category.parentId && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[category.type]}`}
            >
              {TYPE_LABELS[category.type]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onAddSubcategory && (
            <Button variant="ghost" size="icon" title="Add subcategory" onClick={onAddSubcategory}>
              <Plus className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(category)}>
            <Pencil className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

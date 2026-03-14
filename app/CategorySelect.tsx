"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, CategoryType } from "@prisma/client";
import { useState, useMemo } from "react";
import { BORROWING_TRANSACTION_TYPES, LOAN_TRANSACTION_TYPES } from "@/lib/utils";

type Props = {
  categories: Category[];
  className?: string;
  value?: string;
  onChange: (value: string) => void;
};

type Tab = "expense" | "income" | "debt";

const TABS: { id: Tab; label: string }[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "debt", label: "Debt/Loan" },
];

const DEBT_TYPES = [
  ...BORROWING_TRANSACTION_TYPES,
  ...LOAN_TRANSACTION_TYPES,
] as CategoryType[];

function getTab(type: CategoryType): Tab {
  if (type === CategoryType.EXPENSE) return "expense";
  if (type === CategoryType.INCOME) return "income";
  return "debt";
}

const CategorySelect = ({ categories, className, value, onChange, ...props }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("expense");

  const tabCategories = useMemo(
    () => categories.filter((c) => getTab(c.type) === activeTab),
    [categories, activeTab]
  );

  return (
    <Select {...props} value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {/* Tabs */}
        <div className="flex border-b border-border mb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setActiveTab(tab.id);
              }}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="h-48 overflow-y-auto">
          {tabCategories.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No categories</div>
          ) : (
            tabCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
};

export default CategorySelect;

"use client";

import { useState, useMemo, useRef } from "react";
import { Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TransactionCategory } from "@/lib/api/transaction-categories";
import { CategoryIcon } from "@/components/transaction-categories/category-icon";

export type BudgetCategoryMode = "all" | "include" | "exclude";

interface BudgetCategorySelectorProps {
  categories: TransactionCategory[];
  mode: BudgetCategoryMode;
  selectedIds: string[];
  onModeChange: (mode: BudgetCategoryMode) => void;
  onSelectedIdsChange: (ids: string[]) => void;
}

function CategoryMultiList({
  categories,
  filteredCategories,
  selectedIds,
  onToggle,
}: {
  categories: TransactionCategory[];
  filteredCategories: TransactionCategory[] | null;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const visible = filteredCategories
    ? filteredCategories.filter((c) => c.type === "expense")
    : expenseCategories;
  const roots = visible.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => visible.filter((c) => c.parentId === parentId);
  const orphanChildren = filteredCategories
    ? visible.filter((c) => c.parentId && !visible.find((p) => p.id === c.parentId))
    : [];

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories found.</p>;
  }

  return (
    <>
      {roots.map((root) => {
        const children = childrenOf(root.id);
        return (
          <div key={root.id}>
            {children.length > 0 ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onToggle(root.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    selectedIds.includes(root.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  )}
                >
                  <CategoryIcon icon={root.icon} size={13} />
                  {root.name}
                </button>
                <div className="flex flex-wrap gap-2 pl-3 border-l-2 border-muted ml-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onToggle(child.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                        selectedIds.includes(child.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:bg-accent"
                      )}
                    >
                      <CategoryIcon icon={child.icon} size={13} />
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onToggle(root.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                  selectedIds.includes(root.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent"
                )}
              >
                <CategoryIcon icon={root.icon} size={13} />
                {root.name}
              </button>
            )}
          </div>
        );
      })}
      {orphanChildren.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {orphanChildren.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onToggle(child.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                selectedIds.includes(child.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-accent"
              )}
            >
              <CategoryIcon icon={child.icon} size={13} />
              {child.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const MODE_OPTIONS: { value: BudgetCategoryMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "include", label: "Specific" },
  { value: "exclude", label: "All except" },
];

export function BudgetCategorySelector({
  categories,
  mode,
  selectedIds,
  onModeChange,
  onSelectedIdsChange,
}: BudgetCategorySelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    const q = categoryFilter.trim().toLowerCase();
    if (!q) return null;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categoryFilter]);

  function handleToggle(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  }

  function handleModeChange(newMode: BudgetCategoryMode) {
    onModeChange(newMode);
    onSelectedIdsChange([]);
  }

  const showPicker = mode !== "all";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Categories</Label>
        {showPicker && (
          <button
            type="button"
            onClick={() => {
              if (filterOpen) {
                setFilterOpen(false);
                setCategoryFilter("");
              } else {
                setFilterOpen(true);
                setTimeout(() => filterInputRef.current?.focus(), 0);
              }
            }}
            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {filterOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
        )}
      </div>

      <div className="flex rounded-md border border-input overflow-hidden text-sm">
        {MODE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleModeChange(value)}
            className={cn(
              "flex-1 py-1.5 transition-colors",
              mode === value
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {showPicker && (
        <>
          {filterOpen && (
            <input
              ref={filterInputRef}
              type="text"
              placeholder="Filter categories…"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          )}
          {selectedIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} {mode === "exclude" ? "excluded" : "selected"}
              <button
                type="button"
                onClick={() => onSelectedIdsChange([])}
                className="ml-2 underline hover:text-foreground"
              >
                clear
              </button>
            </p>
          )}
          <div className="h-48 overflow-y-auto space-y-2">
            <CategoryMultiList
              categories={categories}
              filteredCategories={filteredCategories}
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
          </div>
        </>
      )}
    </div>
  );
}

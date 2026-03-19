"use client";

import { useState, useMemo, useRef } from "react";
import { Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TransactionCategory, CategoryType } from "@/lib/api/transaction-categories";
import { CategoryIcon } from "@/components/transaction-categories/category-icon";

const TAB_TYPES: { value: CategoryType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "payable", label: "Payable" },
  { value: "receivable", label: "Receivable" },
];

interface CategorySelectorProps {
  categories: TransactionCategory[];
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  /** When provided, only shows this type without tabs */
  filterType?: CategoryType;
}

function CategoryList({
  categories,
  filteredCategories,
  selectedCategoryId,
  onCategoryChange,
  type,
}: {
  categories: TransactionCategory[];
  filteredCategories: TransactionCategory[] | null;
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  type: CategoryType;
}) {
  const typeCategories = categories.filter((c) => c.type === type);
  const visible = filteredCategories
    ? filteredCategories.filter((c) => c.type === type)
    : typeCategories;
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
                  onClick={() => onCategoryChange(root.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    selectedCategoryId === root.id
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
                      onClick={() => onCategoryChange(child.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                        selectedCategoryId === child.id
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
                onClick={() => onCategoryChange(root.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                  selectedCategoryId === root.id
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
              onClick={() => onCategoryChange(child.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                selectedCategoryId === child.id
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

export function CategorySelector({
  categories,
  selectedCategoryId,
  onCategoryChange,
  filterType,
}: CategorySelectorProps) {
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const defaultTab = filterType ?? selectedCategory?.type ?? "expense";
  const [activeTab, setActiveTab] = useState<CategoryType>(defaultTab);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    const q = categoryFilter.trim().toLowerCase();
    if (!q) return null;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categoryFilter]);

  function handleTabChange(tab: string) {
    setActiveTab(tab as CategoryType);
    onCategoryChange("");
  }

  const tabs = filterType ? TAB_TYPES.filter((t) => t.value === filterType) : TAB_TYPES;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Category</Label>
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
      </div>
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
      {filterType ? (
        <div className="h-48 overflow-y-auto space-y-2">
          <button
            type="button"
            onClick={() => onCategoryChange("")}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              selectedCategoryId === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent"
            )}
          >
            All
          </button>
          <CategoryList
            categories={categories}
            filteredCategories={filteredCategories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={onCategoryChange}
            type={filterType}
          />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {tabs.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="flex-1">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="h-48 mt-2 overflow-y-auto">
            {tabs.map(({ value: type }) => (
              <div key={type} className={cn("space-y-2", activeTab !== type && "hidden")}>
                <CategoryList
                  categories={categories}
                  filteredCategories={filteredCategories}
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={onCategoryChange}
                  type={type}
                />
              </div>
            ))}
          </div>
        </Tabs>
      )}
    </div>
  );
}

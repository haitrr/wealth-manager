"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TransactionCategory, CategoryType } from "@/lib/api/transaction-categories";
import { CategoryIcon } from "@/components/transaction-categories/category-icon";

const TAB_TYPES: { value: CategoryType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

interface CategorySelectorProps {
  categories: TransactionCategory[];
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  /** When provided, only shows this type without tabs */
  filterType?: CategoryType;
  label?: string;
  placeholder?: string;
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
                  data-selected={selectedCategoryId === root.id || undefined}
                  onClick={() => onCategoryChange(root.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-4 py-2 text-base font-medium transition-colors",
                    selectedCategoryId === root.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  )}
                >
                  <CategoryIcon icon={root.icon} size={16} />
                  {root.name}
                </button>
                <div className="flex flex-wrap gap-2 pl-3 border-l-2 border-muted ml-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      data-selected={selectedCategoryId === child.id || undefined}
                      onClick={() => onCategoryChange(child.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-4 py-2 text-base transition-colors",
                        selectedCategoryId === child.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:bg-accent"
                      )}
                    >
                      <CategoryIcon icon={child.icon} size={16} />
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-selected={selectedCategoryId === root.id || undefined}
                onClick={() => onCategoryChange(root.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-2 text-base transition-colors",
                  selectedCategoryId === root.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent"
                )}
              >
                <CategoryIcon icon={root.icon} size={16} />
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
              data-selected={selectedCategoryId === child.id || undefined}
              onClick={() => onCategoryChange(child.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-base transition-colors",
                selectedCategoryId === child.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-accent"
              )}
            >
              <CategoryIcon icon={child.icon} size={16} />
              {child.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function CategorySearchModal({
  open,
  onClose,
  categories,
  selectedCategoryId,
  onCategoryChange,
  filterType,
}: {
  open: boolean;
  onClose: () => void;
  categories: TransactionCategory[];
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  filterType?: CategoryType;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const defaultTab = filterType ?? selectedCategory?.type ?? "expense";
  const [activeTab, setActiveTab] = useState<CategoryType>(defaultTab);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      scrollRef.current?.querySelector("[data-selected]")?.scrollIntoView({ block: "center" });
    }, 50);
  }, []);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const tabs = filterType ? TAB_TYPES.filter((t) => t.value === filterType) : TAB_TYPES;

  function handleSelect(id: string) {
    onCategoryChange(id);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="inset-0 translate-x-0 translate-y-0 max-w-full w-full h-dvh rounded-none md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-[95vw] md:h-auto md:max-h-[90dvh] md:rounded-xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Category</DialogTitle>
        </DialogHeader>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
        />
        {filterType ? (
          <div ref={scrollRef} className="overflow-y-auto flex-1 space-y-2">
            <CategoryList
              categories={categories}
              filteredCategories={filteredCategories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleSelect}
              type={filterType}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(t) => setActiveTab(t as CategoryType)} className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full shrink-0">
              {tabs.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="flex-1">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div ref={scrollRef} className="overflow-y-auto flex-1 mt-2">
              {tabs.map(({ value: type }) => (
                <div key={type} className={cn("space-y-2", activeTab !== type && "hidden")}>
                  <CategoryList
                    categories={categories}
                    filteredCategories={filteredCategories}
                    selectedCategoryId={selectedCategoryId}
                    onCategoryChange={handleSelect}
                    type={type}
                  />
                </div>
              ))}
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onCategoryChange,
  filterType,
  label = "Category",
  placeholder = "Select a category…",
}: CategorySelectorProps) {
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm hover:bg-accent transition-colors"
      >
        {selectedCategory ? (
          <>
            <CategoryIcon icon={selectedCategory.icon} size={14} />
            <span>{selectedCategory.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <Search className="size-4 ml-auto text-muted-foreground" />
      </button>
      <CategorySearchModal
        key={searchOpen ? "open" : "closed"}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={onCategoryChange}
        filterType={filterType}
      />
    </div>
  );
}

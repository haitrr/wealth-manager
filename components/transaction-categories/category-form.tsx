"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { ChevronDown, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TransactionCategory, CategoryType } from "@/lib/api/transaction-categories";

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: "Income",
  expense: "Expense",
  payable: "Payable (Borrowed)",
  receivable: "Receivable (Lent)",
};

const TYPE_ORDER: CategoryType[] = ["expense", "income", "payable", "receivable"];

// --- Picker dropdown content ---

interface PickerDropdownProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearch: (v: string) => void;
  filtered: TransactionCategory[];
  value: string;
  onSelect: (id: string) => void;
}

function PickerDropdown({ inputRef, search, onSearch, filtered, value, onSelect }: PickerDropdownProps) {
  const itemCls = (active: boolean) =>
    cn("flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent", active && "bg-accent font-medium");

  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
      <div className="flex items-center border-b px-3">
        <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search categories…"
          className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
        <button type="button" onClick={() => onSelect("")} className={itemCls(!value)}>
          None (top-level category)
        </button>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No categories found</p>
        )}
        {filtered.map((opt) => (
          <button key={opt.id} type="button" onClick={() => onSelect(opt.id)} className={itemCls(value === opt.id)}>
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Searchable parent picker ---

interface ParentPickerProps {
  options: TransactionCategory[];
  value: string;
  onChange: (id: string) => void;
}

function ParentPicker({ options, value, onChange }: ParentPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function openDropdown() {
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={openDropdown}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? selected.name : "None (top-level category)"}</span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selected && (
            <X
              className="size-3.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); select(""); }}
            />
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <PickerDropdown
          inputRef={inputRef}
          search={search}
          onSearch={setSearch}
          filtered={filtered}
          value={value}
          onSelect={select}
        />
      )}
    </div>
  );
}

// --- Type select ---

function TypeSelect({ value, onChange, disabled }: { value: CategoryType; onChange: (v: CategoryType) => void; disabled: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CategoryType)} disabled={disabled}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{CATEGORY_TYPE_LABELS[t]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// --- Main form ---

interface CategoryFormProps {
  open: boolean;
  category?: TransactionCategory | null;
  parentCategories: TransactionCategory[];
  defaultParentId?: string | null;
  onClose: () => void;
  onSubmit: (data: { name: string; type: CategoryType; parentId?: string | null }) => Promise<void>;
  onDelete?: (category: TransactionCategory) => void;
}

export function CategoryForm({
  open,
  category,
  parentCategories,
  defaultParentId,
  onClose,
  onSubmit,
  onDelete,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>(
    category?.parentId ?? defaultParentId ?? ""
  );
  const [selectedType, setSelectedType] = useState<CategoryType>(category?.type ?? "expense");

  useEffect(() => {
    if (open) {
      setSelectedParentId(category?.parentId ?? defaultParentId ?? "");
      setSelectedType(category?.type ?? "expense");
      setError("");
      setConfirmDelete(false);
    }
  }, [open, category, defaultParentId]);

  const selectedParent = parentCategories.find((p) => p.id === selectedParentId);

  // Only show parents that match the selected type
  const filteredParents = parentCategories.filter((p) => p.type === selectedType);

  function handleTypeChange(type: CategoryType) {
    setSelectedType(type);
    // Clear parent if it no longer matches the new type
    if (selectedParentId) {
      const parent = parentCategories.find((p) => p.id === selectedParentId);
      if (parent && parent.type !== type) {
        setSelectedParentId("");
      }
    }
  }

  function handleParentChange(id: string) {
    setSelectedParentId(id);
    if (id) {
      const parent = parentCategories.find((p) => p.id === id);
      if (parent) setSelectedType(parent.type);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const type = selectedParent ? selectedParent.type : selectedType;

    try {
      await onSubmit({ name, type, parentId: selectedParentId || null });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      setSelectedParentId(category?.parentId ?? defaultParentId ?? "");
      setSelectedType(category?.type ?? "expense");
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Salary, Food"
                defaultValue={category?.name ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <TypeSelect value={selectedType} onChange={handleTypeChange} disabled={!!selectedParent} />
              {selectedParent && (
                <p className="text-xs text-muted-foreground">Inherited from parent category</p>
              )}
            </div>

            {parentCategories.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Category (optional)</Label>
                <ParentPicker
                  options={filteredParents}
                  value={selectedParentId}
                  onChange={handleParentChange}
                />
                {filteredParents.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No {CATEGORY_TYPE_LABELS[selectedType].toLowerCase()} categories available as parent
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="-mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4">
            {category && onDelete && confirmDelete ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-destructive">Delete this category?</span>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(category); onClose(); }}>
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  {category && onDelete && (
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} disabled={loading}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : category ? "Save Changes" : "Add Category"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

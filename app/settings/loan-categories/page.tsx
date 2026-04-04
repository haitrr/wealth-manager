"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTransactionCategories } from "@/lib/api/transaction-categories";
import { getSettings, updateSettings, UserSettings, UserSettingsPayload } from "@/lib/api/settings";
import { TransactionCategory } from "@/lib/api/transaction-categories";

function CategorySelect({
  id,
  value,
  onChange,
  categories,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  categories: TransactionCategory[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">Auto (use default)</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

function LoanCategoriesForm({
  settings,
  categories,
}: {
  settings: UserSettings;
  categories: TransactionCategory[];
}) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<UserSettingsPayload>({
    loanBorrowedPrincipalCategoryId: settings.loanBorrowedPrincipalCategoryId,
    loanBorrowedInterestCategoryId: settings.loanBorrowedInterestCategoryId,
    loanBorrowedPrepayFeeCategoryId: settings.loanBorrowedPrepayFeeCategoryId,
    loanLentPrincipalCategoryId: settings.loanLentPrincipalCategoryId,
    loanLentInterestCategoryId: settings.loanLentInterestCategoryId,
    loanLentPrepayFeeCategoryId: settings.loanLentPrepayFeeCategoryId,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
    },
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function set(key: keyof UserSettingsPayload, value: string) {
    setForm((prev) => ({ ...prev, [key]: value || null }));
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Loan Category Defaults</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Default categories used when a loan has <strong>Auto</strong> selected. Loans with a specific category set always use that instead.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">Borrowed loans</p>
        <div className="space-y-2">
          <Label htmlFor="borrowed-principal" className="text-xs">Principal repayment</Label>
          <CategorySelect
            id="borrowed-principal"
            value={form.loanBorrowedPrincipalCategoryId ?? ""}
            onChange={(v) => set("loanBorrowedPrincipalCategoryId", v)}
            categories={expenseCategories}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="borrowed-interest" className="text-xs">Interest</Label>
          <CategorySelect
            id="borrowed-interest"
            value={form.loanBorrowedInterestCategoryId ?? ""}
            onChange={(v) => set("loanBorrowedInterestCategoryId", v)}
            categories={expenseCategories}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="borrowed-prepay" className="text-xs">Prepay fee</Label>
          <CategorySelect
            id="borrowed-prepay"
            value={form.loanBorrowedPrepayFeeCategoryId ?? ""}
            onChange={(v) => set("loanBorrowedPrepayFeeCategoryId", v)}
            categories={expenseCategories}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">Lent loans</p>
        <div className="space-y-2">
          <Label htmlFor="lent-principal" className="text-xs">Principal collection</Label>
          <CategorySelect
            id="lent-principal"
            value={form.loanLentPrincipalCategoryId ?? ""}
            onChange={(v) => set("loanLentPrincipalCategoryId", v)}
            categories={incomeCategories}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lent-interest" className="text-xs">Interest</Label>
          <CategorySelect
            id="lent-interest"
            value={form.loanLentInterestCategoryId ?? ""}
            onChange={(v) => set("loanLentInterestCategoryId", v)}
            categories={incomeCategories}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lent-prepay" className="text-xs">Prepay fee</Label>
          <CategorySelect
            id="lent-prepay"
            value={form.loanLentPrepayFeeCategoryId ?? ""}
            onChange={(v) => set("loanLentPrepayFeeCategoryId", v)}
            categories={expenseCategories}
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive">
          {mutation.error instanceof Error ? mutation.error.message : "Failed to save settings"}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            Saved
          </span>
        )}
      </div>
    </main>
  );
}

export default function LoanCategoriesSettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
  });

  if (settingsLoading || !settings) {
    return <main className="max-w-lg mx-auto px-4 py-8"><p className="text-sm text-muted-foreground">Loading…</p></main>;
  }

  return <LoanCategoriesForm settings={settings} categories={categories} />;
}

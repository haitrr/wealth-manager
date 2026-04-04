"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTransactionCategories, TransactionCategory } from "@/lib/api/transaction-categories";
import { getSettings, updateSettings, UserSettings, UserSettingsPayload } from "@/lib/api/settings";
import { CategorySelector } from "@/components/transactions/category-selector";

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
        <CategorySelector
          categories={categories}
          selectedCategoryId={form.loanBorrowedPrincipalCategoryId ?? ""}
          onCategoryChange={(v) => set("loanBorrowedPrincipalCategoryId", v)}
          filterType="expense"
          label="Principal repayment"
          placeholder="Auto (use default)"
        />
        <CategorySelector
          categories={categories}
          selectedCategoryId={form.loanBorrowedInterestCategoryId ?? ""}
          onCategoryChange={(v) => set("loanBorrowedInterestCategoryId", v)}
          filterType="expense"
          label="Interest"
          placeholder="Auto (use default)"
        />
        <CategorySelector
          categories={categories}
          selectedCategoryId={form.loanBorrowedPrepayFeeCategoryId ?? ""}
          onCategoryChange={(v) => set("loanBorrowedPrepayFeeCategoryId", v)}
          filterType="expense"
          label="Prepay fee"
          placeholder="Auto (use default)"
        />
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">Lent loans</p>
        <CategorySelector
          categories={categories}
          selectedCategoryId={form.loanLentPrincipalCategoryId ?? ""}
          onCategoryChange={(v) => set("loanLentPrincipalCategoryId", v)}
          filterType="income"
          label="Principal collection"
          placeholder="Auto (use default)"
        />
        <CategorySelector
          categories={categories}
          selectedCategoryId={form.loanLentInterestCategoryId ?? ""}
          onCategoryChange={(v) => set("loanLentInterestCategoryId", v)}
          filterType="income"
          label="Interest"
          placeholder="Auto (use default)"
        />
        <CategorySelector
          categories={categories}
          selectedCategoryId={form.loanLentPrepayFeeCategoryId ?? ""}
          onCategoryChange={(v) => set("loanLentPrepayFeeCategoryId", v)}
          filterType="expense"
          label="Prepay fee"
          placeholder="Auto (use default)"
        />
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

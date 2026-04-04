"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanForm } from "@/components/loans/loan-form";
import { getAccounts } from "@/lib/api/accounts";
import { createLoan, deleteLoan, getLoans, Loan, LoanDirection, updateLoan } from "@/lib/api/loans";
import { getTransactionCategories } from "@/lib/api/transaction-categories";
import { formatCurrency } from "@/lib/utils";

const DIRECTION_LABELS = {
  borrowed: "Borrowed",
  lent: "Lent",
} as const;

export default function LoansSettingsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [createDirection, setCreateDirection] = useState<LoanDirection>("borrowed");

  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const createMutation = useMutation({ mutationFn: createLoan, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof updateLoan>[1]) => updateLoan(id, payload),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteLoan, onSuccess: invalidate });

  const activeLoans = loans.filter((loan) => loan.status !== "closed");
  const closedLoans = loans.filter((loan) => loan.status === "closed");

  function openAdd(direction: LoanDirection) {
    setEditingLoan(null);
    setCreateDirection(direction);
    setFormOpen(true);
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Loans</h1>
          <p className="text-sm text-muted-foreground">Track borrowed and lent loans.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
          <Button onClick={() => openAdd("borrowed")} size="sm" disabled={accounts.length === 0}>
            <Plus className="size-4 mr-1" />
            Add Borrowed
          </Button>
          <Button onClick={() => openAdd("lent")} size="sm" variant="outline" disabled={accounts.length === 0}>
            <Plus className="size-4 mr-1" />
            Add Lent
          </Button>
        </div>
      </div>

      {accounts.length === 0 && (
        <p className="text-sm text-muted-foreground mb-4">Add an account before creating loans.</p>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && error && <p className="text-sm text-destructive">Unable to load loans right now.</p>}

      {!isLoading && !error && loans.length === 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">No loans yet</p>
          <p className="text-sm text-muted-foreground">Add a borrowed or lent loan to track your progress.</p>
        </div>
      )}

      {!isLoading && !error && loans.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Active loans</p>
            <p className="mt-1 text-lg font-semibold">{activeLoans.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Closed loans</p>
            <p className="mt-1 text-lg font-semibold">{closedLoans.length}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loans.map((loan) => {
          const progress = Math.max(0, Math.min(100, loan.summary.progressPercent));
          return (
            <Link
              key={loan.id}
              href={`/loans/${loan.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-sm">{loan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DIRECTION_LABELS[loan.direction]}{loan.counterpartyName ? ` · ${loan.counterpartyName}` : ""}
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              </div>

              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${loan.direction === "borrowed" ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <WalletCards className="size-3.5" />
                  {formatCurrency(loan.summary.remainingPrincipal, loan.currency)} remaining
                </span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </Link>
          );
        })}
      </div>

      <LoanForm
        open={formOpen}
        loan={editingLoan}
        defaultDirection={editingLoan ? undefined : createDirection}
        accounts={accounts}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={async (payload) => {
          if (editingLoan) {
            await updateMutation.mutateAsync({ id: editingLoan.id, ...payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
        onDelete={editingLoan ? async (loan) => { await deleteMutation.mutateAsync(loan.id); } : undefined}
      />
    </main>
  );
}

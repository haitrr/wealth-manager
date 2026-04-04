"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Percent, Plus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanForm } from "@/components/loans/loan-form";
import { getAccounts } from "@/lib/api/accounts";
import { createLoan, deleteLoan, getLoans, Loan, LoanDirection, updateLoan } from "@/lib/api/loans";
import { formatCurrency } from "@/lib/utils";

const DIRECTION_LABELS = {
  borrowed: "Borrowed",
  lent: "Lent",
} as const;

const PRODUCT_LABELS = {
  installment: "Installment",
  bullet: "Bullet",
} as const;

const STRATEGY_LABELS = {
  equal_principal: "Equal principal",
  annuity: "Annuity",
  bullet: "Bullet",
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
          <p className="text-sm text-muted-foreground">
            Create and manage Vietnamese reducing-balance loans, bullet loans, and rate periods.
          </p>
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
        <p className="text-sm text-muted-foreground mb-4">
          Add an account before creating loans.
        </p>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && error && (
        <p className="text-sm text-destructive">Unable to load loans right now.</p>
      )}

      {!isLoading && !error && loans.length === 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">No loans yet</p>
          <p className="text-sm text-muted-foreground">
            Add a borrowed or lent loan to track rate periods, repayment schedules, prepayments, and floating-rate repricing.
          </p>
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
        {loans.map((loan) => (
          <Link
            key={loan.id}
            href={`/loans/${loan.id}`}
            className="block rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{loan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {DIRECTION_LABELS[loan.direction]} · {PRODUCT_LABELS[loan.productType]} · {STRATEGY_LABELS[loan.installmentStrategy]}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <WalletCards className="size-3.5" /> Remaining
                </div>
                <p className="mt-1 text-sm font-medium">
                  {formatCurrency(loan.summary.remainingPrincipal, loan.currency)}
                </p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Percent className="size-3.5" /> Current rate
                </div>
                <p className="mt-1 text-sm font-medium">
                  {loan.summary.currentAnnualRate.toFixed(2)}% · {loan.summary.currentRatePeriodType}
                </p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Next due
                </div>
                <p className="mt-1 text-sm font-medium">
                  {loan.summary.nextDueDate
                    ? new Date(loan.summary.nextDueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Closed"}
                </p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="mt-1 text-sm font-medium">{loan.summary.progressPercent.toFixed(1)}%</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <LoanForm
        open={formOpen}
        loan={editingLoan}
        defaultDirection={editingLoan ? undefined : createDirection}
        accounts={accounts}
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

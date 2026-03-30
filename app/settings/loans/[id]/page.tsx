"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, Pencil, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanPayoffChart } from "@/components/dashboard/loan-payoff-chart";
import { LoanForm } from "@/components/loans/loan-form";
import { LoanPaymentForm } from "@/components/loans/loan-payment-form";
import { LoanRepricingForm } from "@/components/loans/loan-repricing-form";
import { getAccounts } from "@/lib/api/accounts";
import { createLoanPayment, deleteLoan, getLoan, LoanPayment, repriceLoan, updateLoan, updateLoanPayment } from "@/lib/api/loans";
import { formatCurrency } from "@/lib/utils";

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [repricingOpen, setRepricingOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<LoanPayment | null>(null);

  const { data: loan, isLoading } = useQuery({
    queryKey: ["loans", id],
    queryFn: () => getLoan(id),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["loans", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateLoan>[1]) => updateLoan(id, payload),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: () => deleteLoan(id), onSuccess: invalidate });
  const paymentMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createLoanPayment>[1]) => createLoanPayment(id, payload),
    onSuccess: invalidate,
  });
  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: Parameters<typeof updateLoanPayment>[2] }) =>
      updateLoanPayment(id, paymentId, payload),
    onSuccess: invalidate,
  });
  const repricingMutation = useMutation({
    mutationFn: (payload: Parameters<typeof repriceLoan>[1]) => repriceLoan(id, payload),
    onSuccess: invalidate,
  });

  const hasFloatingRate = loan?.ratePeriods.some((period) => period.periodType === "floating") ?? false;

  if (isLoading) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 pb-24">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!loan) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 pb-24">
        <p className="text-sm text-destructive">Loan not found.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/loans" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{loan.name}</h1>
          <p className="text-sm text-muted-foreground">
            {loan.productType} · {loan.installmentStrategy} · {loan.status}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" />
        </Button>
      </div>

      <div className="rounded-lg border p-4 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Principal</p>
            <p className="text-sm font-medium">{formatCurrency(loan.principalAmount, loan.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-sm font-medium">{formatCurrency(loan.remainingPrincipal, loan.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current rate</p>
            <p className="text-sm font-medium">{loan.summary.currentAnnualRate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Counterparty</p>
            <p className="text-sm font-medium">{loan.counterpartyName ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              setEditingPayment(null);
              setPaymentOpen(true);
            }}
            disabled={loan.status === "closed"}
          >
            <Coins className="size-4 mr-1" />
            Record Payment
          </Button>
          <Button variant="outline" onClick={() => setRepricingOpen(true)} disabled={!hasFloatingRate || loan.status === "closed"}>
            <TrendingUp className="size-4 mr-1" />
            Update Rate
          </Button>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Rate periods</h2>
        <div className="space-y-2">
          {loan.ratePeriods.map((period) => (
            <div key={period.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{period.periodType} rate</p>
                <p className="text-sm">{period.annualRate.toFixed(2)}%</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(period.startDate).toLocaleDateString("en-US")} - {period.endDate ? new Date(period.endDate).toLocaleDateString("en-US") : "Open ended"}
                {period.repricingIntervalMonths ? ` · Reprice every ${period.repricingIntervalMonths} month(s)` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Payments</h2>
        {loan.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {loan.payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{payment.paymentKind}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatCurrency(payment.totalAmount, loan.currency)}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(event) => {
                        event.preventDefault();
                        setEditingPayment(payment);
                        setPaymentOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p>{formatCurrency(payment.principalAmount, loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest</p>
                    <p>{formatCurrency(payment.interestAmount, loan.currency)}</p>
                  </div>
                </div>
                {payment.note && <p className="text-xs text-muted-foreground mt-2">{payment.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Payoff projection</h2>
        <div className="mb-6">
          <LoanPayoffChart loan={loan} />
        </div>

      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Schedule preview</h2>
        <div className="space-y-2">
          {loan.scheduleEntries.slice(0, 12).map((entry) => (
            <div key={entry.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Installment {entry.installmentIndex}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.dueDate).toLocaleDateString("en-US")}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <p>{formatCurrency(entry.scheduledPrincipal, loan.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest</p>
                  <p>{formatCurrency(entry.scheduledInterest, loan.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p>{formatCurrency(entry.scheduledTotal, loan.currency)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LoanForm
        open={editOpen}
        loan={loan}
        accounts={accounts}
        onClose={() => setEditOpen(false)}
        onSubmit={async (payload) => {
          await updateMutation.mutateAsync(payload);
        }}
        onDelete={async () => {
          await deleteMutation.mutateAsync();
          router.push("/loans");
        }}
      />

      <LoanPaymentForm
        open={paymentOpen}
        loan={loan}
        payment={editingPayment}
        accounts={accounts.filter((account) => account.currency === loan.currency)}
        onClose={() => {
          setPaymentOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={async (payload) => {
          if (editingPayment) {
            await updatePaymentMutation.mutateAsync({ paymentId: editingPayment.id, payload });
            return;
          }

          await paymentMutation.mutateAsync(payload);
        }}
      />

      <LoanRepricingForm
        open={repricingOpen}
        loan={loan}
        onClose={() => setRepricingOpen(false)}
        onSubmit={async (payload) => {
          await repricingMutation.mutateAsync(payload);
        }}
      />
    </main>
  );
}

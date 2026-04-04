"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanForm } from "@/components/loans/loan-form";
import { LoanPaymentForm } from "@/components/loans/loan-payment-form";
import { getAccounts } from "@/lib/api/accounts";
import { createLoanPayment, deleteLoan, deleteLoanPayment, getLoan, LoanPayment, updateLoan, updateLoanPayment } from "@/lib/api/loans";
import { formatCurrency } from "@/lib/utils";

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
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
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => deleteLoanPayment(id, paymentId),
    onSuccess: invalidate,
  });

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

  const progress = Math.max(0, Math.min(100, loan.summary.progressPercent));

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/loans" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{loan.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {loan.direction} · {loan.status}
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
            <p className="text-sm font-medium">{formatCurrency(loan.summary.remainingPrincipal, loan.currency)}</p>
          </div>
          {loan.counterpartyName && (
            <div>
              <p className="text-xs text-muted-foreground">Counterparty</p>
              <p className="text-sm font-medium">{loan.counterpartyName}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-sm font-medium">{progress.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${loan.direction === "borrowed" ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            setEditingPayment(null);
            setPaymentOpen(true);
          }}
          disabled={loan.status === "closed"}
        >
          <Coins className="size-4 mr-1" />
          Record Payment
        </Button>
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Payments</h2>
        {loan.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {loan.payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.paymentDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setEditingPayment(payment);
                        setPaymentOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => deletePaymentMutation.mutate(payment.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p>{formatCurrency(payment.principalAmount, loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest</p>
                    <p>{formatCurrency(payment.interestAmount, loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prepay fee</p>
                    <p>{formatCurrency(payment.prepayFeeAmount, loan.currency)}</p>
                  </div>
                </div>
                {payment.note && <p className="text-xs text-muted-foreground mt-2">{payment.note}</p>}
              </div>
            ))}
          </div>
        )}
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
        accounts={accounts.filter((a) => a.currency === loan.currency)}
        onClose={() => {
          setPaymentOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={async (payload) => {
          if (editingPayment) {
            await updatePaymentMutation.mutateAsync({ paymentId: editingPayment.id, payload });
          } else {
            await paymentMutation.mutateAsync(payload);
          }
        }}
      />
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useEffectEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AmountInput } from "@/components/transactions/amount-input";
import { Account } from "@/lib/api/accounts";
import { Loan, LoanPayment, LoanPaymentKind, LoanPaymentPayload, PrepaymentStrategy } from "@/lib/api/loans";

const PAYMENT_KIND_OPTIONS: Array<{ value: LoanPaymentKind; label: string }> = [
  { value: "scheduled", label: "Scheduled payment" },
  { value: "prepayment", label: "Prepayment" },
  { value: "adjustment", label: "Adjustment" },
];

const PREPAYMENT_STRATEGY_OPTIONS: Array<{ value: PrepaymentStrategy; label: string }> = [
  { value: "reduce_payment", label: "Reduce future payments" },
  { value: "shorten_term", label: "Shorten remaining term" },
];

interface LoanPaymentFormProps {
  open: boolean;
  loan: Loan;
  payment?: LoanPayment | null;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (payload: LoanPaymentPayload) => Promise<void>;
}

function parseRawAmount(raw: string) {
  if (!raw) return 0;
  const parsed = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDisplayAmount(amount: number, currency: Loan["currency"]) {
  const decimals = currency === "VND" ? 0 : 2;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function LoanPaymentForm({ open, loan, payment, accounts, onClose, onSubmit }: LoanPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentKind, setPaymentKind] = useState<LoanPaymentKind>(payment?.paymentKind ?? "scheduled");
  const [prepaymentStrategy, setPrepaymentStrategy] = useState<PrepaymentStrategy>(payment?.prepaymentStrategy ?? "reduce_payment");
  const [principalRaw, setPrincipalRaw] = useState("");
  const [interestRaw, setInterestRaw] = useState("");

  const nextEntry = useMemo(
    () => loan.scheduleEntries.find((entry) => entry.status !== "paid") ?? null,
    [loan.scheduleEntries]
  );

  const applySuggestion = useEffectEvent((kind: LoanPaymentKind) => {
    if (kind === "scheduled" && nextEntry) {
      const unpaidPrincipal = Math.max(0, nextEntry.scheduledPrincipal - nextEntry.paidPrincipal);
      const unpaidInterest = Math.max(0, nextEntry.scheduledInterest - nextEntry.paidInterest);
      setPrincipalRaw(String(unpaidPrincipal));
      setInterestRaw(String(unpaidInterest));
      return;
    }

    if (kind === "prepayment") {
      setPrincipalRaw(String(loan.remainingPrincipal));
      setInterestRaw("0");
      return;
    }

    setPrincipalRaw(nextEntry ? String(Math.max(0, nextEntry.scheduledPrincipal - nextEntry.paidPrincipal)) : "0");
    setInterestRaw("0");
  });

  useEffect(() => {
    if (!open) return;
    setError("");
    if (payment) {
      setPaymentKind(payment.paymentKind);
      setPrepaymentStrategy(payment.prepaymentStrategy ?? "reduce_payment");
      setPrincipalRaw(String(payment.principalAmount));
      setInterestRaw(String(payment.interestAmount));
      return;
    }

    setPaymentKind("scheduled");
    setPrepaymentStrategy("reduce_payment");
    applySuggestion("scheduled");
  }, [open, loan.id, nextEntry?.id, payment]);

  useEffect(() => {
    if (!open || payment) return;
    applySuggestion(paymentKind);
  }, [open, payment, paymentKind]);

  const totalAmount = parseRawAmount(principalRaw) + parseRawAmount(interestRaw);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const payload: LoanPaymentPayload = {
      accountId: (form.elements.namedItem("accountId") as HTMLSelectElement).value,
      paymentDate: (form.elements.namedItem("paymentDate") as HTMLInputElement).value,
      paymentKind,
      totalAmount,
      principalAmount: parseRawAmount(principalRaw),
      interestAmount: parseRawAmount(interestRaw),
      note: (form.elements.namedItem("note") as HTMLTextAreaElement).value || undefined,
      prepaymentStrategy: paymentKind === "prepayment" ? prepaymentStrategy : undefined,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Record Payment"}</DialogTitle>
        </DialogHeader>

        <form key={`${loan.id}-${open ? "open" : "closed"}`} onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="paymentKind">Payment kind</Label>
            <select
              id="paymentKind"
              name="paymentKind"
              value={paymentKind}
              onChange={(event) => setPaymentKind(event.target.value as LoanPaymentKind)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {PAYMENT_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {paymentKind === "prepayment" && loan.productType === "installment" && (
            <div className="space-y-2">
              <Label htmlFor="prepaymentStrategy">After prepayment</Label>
              <select
                id="prepaymentStrategy"
                name="prepaymentStrategy"
                value={prepaymentStrategy}
                onChange={(event) => setPrepaymentStrategy(event.target.value as PrepaymentStrategy)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PREPAYMENT_STRATEGY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment date</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={
                  payment
                    ? new Date(payment.paymentDate).toISOString().split("T")[0]
                    : nextEntry
                    ? new Date(nextEntry.dueDate).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <select
                id="accountId"
                name="accountId"
                defaultValue={payment?.accountId ?? loan.accountId}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total amount</Label>
            <Input id="totalAmount" name="totalAmount" value={formatDisplayAmount(totalAmount, loan.currency)} readOnly />
          </div>

          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            {paymentKind === "scheduled"
              ? "Suggested from the next unpaid installment."
              : paymentKind === "prepayment"
              ? prepaymentStrategy === "shorten_term"
                ? "Suggested as a full principal payoff with zero interest. Future installments will keep similar payment amounts and the schedule will end earlier."
                  : "Suggested as a full principal payoff with zero interest. Future installments will be recalculated across the remaining term."
                : "Suggested as principal-only adjustment. Edit principal and interest as needed."}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal</Label>
              <AmountInput
                id="principalAmount"
                name="principalAmount"
                value={principalRaw}
                onValueChange={setPrincipalRaw}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestAmount">Interest</Label>
              <AmountInput
                id="interestAmount"
                name="interestAmount"
                value={interestRaw}
                onValueChange={setInterestRaw}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <textarea
              id="note"
              name="note"
              rows={3}
              defaultValue={payment?.note ?? ""}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Optional memo for this payment"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : payment ? "Save Payment" : "Record Payment"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

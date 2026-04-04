"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AmountInput } from "@/components/transactions/amount-input";
import { Account } from "@/lib/api/accounts";
import { Loan, LoanPayment, LoanPaymentPayload } from "@/lib/api/loans";

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

export function LoanPaymentForm({ open, loan, payment, accounts, onClose, onSubmit }: LoanPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [principalRaw, setPrincipalRaw] = useState("");
  const [interestRaw, setInterestRaw] = useState("");
  const [prepayFeeRaw, setPrepayFeeRaw] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (payment) {
      setPrincipalRaw(payment.principalAmount > 0 ? String(payment.principalAmount) : "");
      setInterestRaw(payment.interestAmount > 0 ? String(payment.interestAmount) : "");
      setPrepayFeeRaw(payment.prepayFeeAmount > 0 ? String(payment.prepayFeeAmount) : "");
    } else {
      setPrincipalRaw("");
      setInterestRaw("");
      setPrepayFeeRaw("");
    }
  }, [open, payment]);

  const totalAmount = parseRawAmount(principalRaw) + parseRawAmount(interestRaw) + parseRawAmount(prepayFeeRaw);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const payload: LoanPaymentPayload = {
      accountId: (form.elements.namedItem("accountId") as HTMLSelectElement).value,
      paymentDate: (form.elements.namedItem("paymentDate") as HTMLInputElement).value,
      principalAmount: parseRawAmount(principalRaw),
      interestAmount: parseRawAmount(interestRaw),
      prepayFeeAmount: parseRawAmount(prepayFeeRaw),
      note: (form.elements.namedItem("note") as HTMLTextAreaElement).value || undefined,
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

  const remainingPrincipal = loan.summary.remainingPrincipal;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Record Payment"}</DialogTitle>
        </DialogHeader>

        <form key={`${loan.id}-${open ? "open" : "closed"}`} onSubmit={handleSubmit} className="space-y-4 py-2">
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

          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
            Remaining principal: <span className="font-medium text-foreground">
              {remainingPrincipal.toLocaleString()} {loan.currency}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal</Label>
              <AmountInput
                id="principalAmount"
                name="principalAmount"
                value={principalRaw}
                onValueChange={setPrincipalRaw}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestAmount">Interest</Label>
              <AmountInput
                id="interestAmount"
                name="interestAmount"
                value={interestRaw}
                onValueChange={setInterestRaw}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepayFeeAmount">Prepay fee</Label>
              <AmountInput
                id="prepayFeeAmount"
                name="prepayFeeAmount"
                value={prepayFeeRaw}
                onValueChange={setPrepayFeeRaw}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total</Label>
            <Input value={totalAmount.toLocaleString()} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <textarea
              id="note"
              name="note"
              rows={2}
              defaultValue={payment?.note ?? ""}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Optional memo"
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

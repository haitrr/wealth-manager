"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getLoans } from "@/lib/api/loans";
import { attachTransactionToLoan, Transaction } from "@/lib/api/transactions";

type PaymentType = "principal" | "interest" | "prepayFee";

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  principal: "Principal",
  interest: "Interest",
  prepayFee: "Prepay Fee",
};

interface AttachLoanDialogProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onAttached: (updated: Transaction) => void;
}

export function AttachLoanDialog({ open, transaction, onClose, onAttached }: AttachLoanDialogProps) {
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("principal");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: loans = [] } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
    enabled: open,
  });

  const activeLoans = loans.filter((l) => l.status === "active");

  const mutation = useMutation({
    mutationFn: () => attachTransactionToLoan(transaction!.id, selectedLoanId, paymentType),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onAttached(updated);
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to attach transaction");
    },
  });

  function handleOpenChange(v: boolean) {
    if (!v) {
      setSelectedLoanId("");
      setPaymentType("principal");
      setError("");
      onClose();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLoanId) {
      setError("Please select a loan");
      return;
    }
    setError("");
    mutation.mutate();
  }

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Attach to Loan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="loanId">Loan</Label>
            <select
              id="loanId"
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Select a loan…</option>
              {activeLoans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.name}
                </option>
              ))}
            </select>
            {activeLoans.length === 0 && (
              <p className="text-xs text-muted-foreground">No active loans found.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment type</Label>
            <div className="flex gap-2">
              {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPaymentType(type)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    paymentType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-transparent hover:bg-accent"
                  }`}
                >
                  {PAYMENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedLoanId}>
              {mutation.isPending ? "Attaching…" : "Attach"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

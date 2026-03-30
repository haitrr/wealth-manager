"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loan, LoanRepricingPayload } from "@/lib/api/loans";

interface LoanRepricingFormProps {
  open: boolean;
  loan: Loan;
  onClose: () => void;
  onSubmit: (payload: LoanRepricingPayload) => Promise<void>;
}

export function LoanRepricingForm({ open, loan, onClose, onSubmit }: LoanRepricingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const floatingPeriod = useMemo(
    () => loan.ratePeriods.find((period) => period.periodType === "floating") ?? null,
    [loan.ratePeriods]
  );
  const firstOpenEntry = useMemo(
    () => loan.scheduleEntries.find((entry) => entry.status !== "paid") ?? null,
    [loan.scheduleEntries]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const payload: LoanRepricingPayload = {
      effectiveDate: (form.elements.namedItem("effectiveDate") as HTMLInputElement).value,
      annualRate: parseFloat((form.elements.namedItem("annualRate") as HTMLInputElement).value),
      repricingIntervalMonths: parseInt((form.elements.namedItem("repricingIntervalMonths") as HTMLInputElement).value, 10),
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update rate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Floating Rate</DialogTitle>
        </DialogHeader>

        <form key={`${loan.id}-${open ? "open" : "closed"}`} onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            Manual repricing updates the active floating period and regenerates future installments only.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective date</Label>
              <Input
                id="effectiveDate"
                name="effectiveDate"
                type="date"
                defaultValue={firstOpenEntry ? new Date(firstOpenEntry.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualRate">Annual rate (%)</Label>
              <Input
                id="annualRate"
                name="annualRate"
                type="number"
                min={0}
                step="0.01"
                defaultValue={floatingPeriod?.annualRate ?? loan.summary.currentAnnualRate}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repricingIntervalMonths">Repricing interval (months)</Label>
            <Input
              id="repricingIntervalMonths"
              name="repricingIntervalMonths"
              type="number"
              min={1}
              defaultValue={floatingPeriod?.repricingIntervalMonths ?? 6}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !floatingPeriod}>{loading ? "Saving…" : "Update Rate"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AmountInput } from "@/components/transactions/amount-input";
import { Account, Currency } from "@/lib/api/accounts";
import { Loan, LoanDirection, LoanPayload, LoanStatus } from "@/lib/api/loans";

interface LoanFormProps {
  open: boolean;
  loan?: Loan | null;
  defaultDirection?: LoanDirection;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (payload: LoanPayload) => Promise<void>;
  onDelete?: (loan: Loan) => Promise<void>;
}

const DIRECTION_OPTIONS: Array<{ value: LoanDirection; label: string }> = [
  { value: "borrowed", label: "Borrowed" },
  { value: "lent", label: "Lent" },
];

const STATUS_OPTIONS: Array<{ value: LoanStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

function NativeSelect({
  id,
  name,
  value,
  defaultValue,
  required,
  options,
  onChange,
}: {
  id: string;
  name: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      required={required}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function LoanForm({ open, loan, defaultDirection, accounts, onClose, onSubmit, onDelete }: LoanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [direction, setDirection] = useState<LoanDirection>(loan?.direction ?? defaultDirection ?? "borrowed");
  const [currency, setCurrency] = useState<Currency>(loan?.currency ?? accounts.find((a) => a.isDefault)?.currency ?? "VND");
  const [status, setStatus] = useState<LoanStatus>(loan?.status ?? "active");

  const defaultAccount = useMemo(() => accounts.find((a) => a.isDefault) ?? accounts[0], [accounts]);
  const directionLabel = DIRECTION_OPTIONS.find((o) => o.value === direction)?.label ?? "Borrowed";

  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    setDirection(loan?.direction ?? defaultDirection ?? "borrowed");
    setCurrency(loan?.currency ?? defaultAccount?.currency ?? "VND");
    setStatus(loan?.status ?? "active");
  }, [open, loan, defaultDirection, defaultAccount?.currency]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const principalAmount = parseFloat(
      (form.elements.namedItem("principalAmount") as HTMLInputElement).value.replace(/,/g, "")
    );

    const payload: LoanPayload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      direction,
      principalAmount,
      currency,
      startDate: (form.elements.namedItem("startDate") as HTMLInputElement).value,
      counterpartyName: (form.elements.namedItem("counterpartyName") as HTMLInputElement).value || undefined,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || undefined,
      status,
      accountId: (form.elements.namedItem("accountId") as HTMLSelectElement).value,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : `Add ${directionLabel} Loan`}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Loan name</Label>
            <Input id="name" name="name" placeholder="e.g. Home loan" defaultValue={loan?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <NativeSelect
                id="direction"
                name="direction"
                value={direction}
                onChange={(value) => setDirection(value as LoanDirection)}
                options={DIRECTION_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <NativeSelect
                id="status"
                name="status"
                value={status}
                onChange={(value) => setStatus(value as LoanStatus)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal</Label>
              <AmountInput id="principalAmount" name="principalAmount" defaultValue={loan?.principalAmount} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <NativeSelect
                id="currency"
                name="currency"
                value={currency}
                onChange={(value) => setCurrency(value as Currency)}
                options={[{ value: "USD", label: "USD" }, { value: "VND", label: "VND" }]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={loan?.startDate ? new Date(loan.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <NativeSelect
                id="accountId"
                name="accountId"
                defaultValue={loan?.accountId ?? defaultAccount?.id ?? ""}
                required
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `${a.name}${a.isDefault ? " (Default)" : ""}`,
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counterpartyName">Counterparty</Label>
            <Input id="counterpartyName" name="counterpartyName" placeholder="e.g. Vietcombank" defaultValue={loan?.counterpartyName ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={loan?.notes ?? ""}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Optional note"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {loan && onDelete && (
                confirmDelete ? (
                  <p className="text-sm text-destructive">Delete this loan?</p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive"
                    onClick={() => setConfirmDelete(true)}
                    disabled={loading}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Delete
                  </Button>
                )
              )}
            </div>
            <div className="flex gap-2">
              {confirmDelete ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await onDelete?.(loan!);
                        onClose();
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {loading ? "Deleting…" : "Confirm Delete"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : loan ? "Save Changes" : `Create ${directionLabel} Loan`}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

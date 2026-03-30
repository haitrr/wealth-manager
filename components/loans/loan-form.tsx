"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AmountInput } from "@/components/transactions/amount-input";
import { EditableRatePeriod, RatePeriodEditor } from "@/components/loans/rate-period-editor";
import { Account, Currency } from "@/lib/api/accounts";
import {
  Loan,
  LoanDirection,
  LoanInstallmentStrategy,
  LoanPayload,
  LoanProductType,
  LoanRatePeriodPayload,
  LoanStatus,
  RepaymentFrequency,
} from "@/lib/api/loans";

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

const PRODUCT_OPTIONS: Array<{ value: LoanProductType; label: string }> = [
  { value: "installment", label: "Installment" },
  { value: "bullet", label: "Bullet" },
];

const STRATEGY_OPTIONS: Array<{ value: LoanInstallmentStrategy; label: string }> = [
  { value: "equal_principal", label: "Equal principal" },
  { value: "annuity", label: "Annuity" },
  { value: "bullet", label: "Bullet" },
];

const FREQUENCY_OPTIONS: Array<{ value: RepaymentFrequency; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const STATUS_OPTIONS: Array<{ value: LoanStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

function NativeSelect({
  id,
  name,
  value,
  defaultValue,
  disabled,
  required,
  options,
  onChange,
}: {
  id: string;
  name: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
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
      disabled={disabled}
      required={required}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function makeInitialRatePeriods(loan?: Loan | null): EditableRatePeriod[] {
  if (!loan) {
    const today = new Date().toISOString().split("T")[0];
    return [
      {
        periodType: "fixed",
        annualRate: "",
        startDate: today,
        endDate: "",
        repricingIntervalMonths: "",
      },
    ];
  }

  return loan.ratePeriods.map((period) => ({
    periodType: period.periodType,
    annualRate: String(period.annualRate),
    startDate: toDateInput(period.startDate),
    endDate: toDateInput(period.endDate),
    repricingIntervalMonths: period.repricingIntervalMonths ? String(period.repricingIntervalMonths) : "",
  }));
}

export function LoanForm({ open, loan, defaultDirection, accounts, onClose, onSubmit, onDelete }: LoanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [direction, setDirection] = useState<LoanDirection>(loan?.direction ?? defaultDirection ?? "borrowed");
  const [productType, setProductType] = useState<LoanProductType>(loan?.productType ?? "installment");
  const [installmentStrategy, setInstallmentStrategy] = useState<LoanInstallmentStrategy>(
    loan?.installmentStrategy ?? "equal_principal"
  );
  const [currency, setCurrency] = useState<Currency>(loan?.currency ?? accounts.find((account) => account.isDefault)?.currency ?? "VND");
  const [repaymentFrequency, setRepaymentFrequency] = useState<RepaymentFrequency>(loan?.repaymentFrequency ?? "monthly");
  const [status, setStatus] = useState<LoanStatus>(loan?.status ?? "active");
  const [ratePeriods, setRatePeriods] = useState<EditableRatePeriod[]>(makeInitialRatePeriods(loan));

  const defaultAccount = useMemo(() => accounts.find((account) => account.isDefault) ?? accounts[0], [accounts]);
  const directionLabel = DIRECTION_OPTIONS.find((option) => option.value === direction)?.label ?? "Borrowed";

  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    setDirection(loan?.direction ?? defaultDirection ?? "borrowed");
    setProductType(loan?.productType ?? "installment");
    setInstallmentStrategy(loan?.installmentStrategy ?? "equal_principal");
    setCurrency(loan?.currency ?? defaultAccount?.currency ?? "VND");
    setRepaymentFrequency(loan?.repaymentFrequency ?? "monthly");
    setStatus(loan?.status ?? "active");
    setRatePeriods(makeInitialRatePeriods(loan));
  }, [open, loan, defaultDirection, defaultAccount?.currency]);

  useEffect(() => {
    if (productType === "bullet") {
      setInstallmentStrategy("bullet");
    } else if (installmentStrategy === "bullet") {
      setInstallmentStrategy("equal_principal");
    }
  }, [productType, installmentStrategy]);

  function updateRatePeriod(index: number, patch: Partial<EditableRatePeriod>) {
    setRatePeriods((current) => current.map((period, periodIndex) => (periodIndex === index ? { ...period, ...patch } : period)));
  }

  function addRatePeriod() {
    const last = ratePeriods[ratePeriods.length - 1];
    setRatePeriods((current) => [
      ...current,
      {
        periodType: "floating",
        annualRate: last?.annualRate ?? "",
        startDate: last?.endDate || last?.startDate || new Date().toISOString().split("T")[0],
        endDate: "",
        repricingIntervalMonths: last?.repricingIntervalMonths || "6",
      },
    ]);
  }

  function removeRatePeriod(index: number) {
    setRatePeriods((current) => current.filter((_, periodIndex) => periodIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const principalAmount = parseFloat(
      (form.elements.namedItem("principalAmount") as HTMLInputElement).value.replace(/,/g, "")
    );
    const termMonths = parseInt((form.elements.namedItem("termMonths") as HTMLInputElement).value, 10);
    const accountId = (form.elements.namedItem("accountId") as HTMLSelectElement).value;

    const payload: LoanPayload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      direction,
      productType,
      installmentStrategy,
      principalAmount,
      currency,
      termMonths,
      repaymentFrequency,
      startDate: (form.elements.namedItem("startDate") as HTMLInputElement).value,
      firstPaymentDate: (form.elements.namedItem("firstPaymentDate") as HTMLInputElement).value,
      counterpartyName: (form.elements.namedItem("counterpartyName") as HTMLInputElement).value || undefined,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || undefined,
      status,
      accountId,
      ratePeriods: ratePeriods.map<LoanRatePeriodPayload>((period) => ({
        periodType: period.periodType,
        annualRate: parseFloat(period.annualRate),
        startDate: period.startDate,
        endDate: period.endDate || null,
        repricingIntervalMonths:
          period.periodType === "floating" && period.repricingIntervalMonths
            ? parseInt(period.repricingIntervalMonths, 10)
            : null,
      })),
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
            <Label htmlFor="name">Loan Name</Label>
            <Input id="name" name="name" placeholder="e.g. Home loan" defaultValue={loan?.name ?? ""} required />
          </div>

          {loan ? (
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
          ) : (
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="productType">Product</Label>
              <NativeSelect
                id="productType"
                name="productType"
                value={productType}
                onChange={(value) => setProductType(value as LoanProductType)}
                options={PRODUCT_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installmentStrategy">Schedule style</Label>
              <NativeSelect
                id="installmentStrategy"
                name="installmentStrategy"
                value={installmentStrategy}
                onChange={(value) => setInstallmentStrategy(value as LoanInstallmentStrategy)}
                disabled={productType === "bullet"}
                options={STRATEGY_OPTIONS.filter((option) =>
                  productType === "bullet" ? option.value === "bullet" : option.value !== "bullet"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="principalAmount">Principal</Label>
            <AmountInput id="principalAmount" name="principalAmount" defaultValue={loan?.principalAmount} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="termMonths">Term (months)</Label>
              <Input id="termMonths" name="termMonths" type="number" min={1} defaultValue={loan?.termMonths ?? 12} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="repaymentFrequency">Repayment frequency</Label>
              <NativeSelect
                id="repaymentFrequency"
                name="repaymentFrequency"
                value={repaymentFrequency}
                onChange={(value) => setRepaymentFrequency(value as RepaymentFrequency)}
                options={FREQUENCY_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <NativeSelect
                id="accountId"
                name="accountId"
                defaultValue={loan?.accountId ?? defaultAccount?.id ?? ""}
                required
                options={accounts.map((account) => ({
                  value: account.id,
                  label: `${account.name}${account.isDefault ? " (Default)" : ""}`,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={toDateInput(loan?.startDate) || new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstPaymentDate">First payment</Label>
              <Input id="firstPaymentDate" name="firstPaymentDate" type="date" defaultValue={toDateInput(loan?.firstPaymentDate) || new Date().toISOString().split("T")[0]} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counterpartyName">Counterparty</Label>
            <Input id="counterpartyName" name="counterpartyName" placeholder="e.g. Vietcombank" defaultValue={loan?.counterpartyName ?? ""} />
          </div>

          <RatePeriodEditor
            ratePeriods={ratePeriods}
            onAdd={addRatePeriod}
            onRemove={removeRatePeriod}
            onChange={updateRatePeriod}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={loan?.notes ?? ""}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Optional note about the loan terms"
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
                  <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
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
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
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

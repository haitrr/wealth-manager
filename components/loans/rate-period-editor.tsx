"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoanRatePeriodType } from "@/lib/api/loans";

export interface EditableRatePeriod {
  periodType: LoanRatePeriodType;
  annualRate: string;
  startDate: string;
  endDate: string;
  repricingIntervalMonths: string;
}

const RATE_TYPE_OPTIONS: Array<{ value: LoanRatePeriodType; label: string }> = [
  { value: "fixed", label: "Fixed" },
  { value: "floating", label: "Floating" },
];

interface RatePeriodEditorProps {
  ratePeriods: EditableRatePeriod[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<EditableRatePeriod>) => void;
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
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

function RatePeriodCard({
  index,
  period,
  canRemove,
  onRemove,
  onChange,
}: {
  index: number;
  period: EditableRatePeriod;
  canRemove: boolean;
  onRemove: () => void;
  onChange: (patch: Partial<EditableRatePeriod>) => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Period {index + 1}</p>
          <p className="text-xs text-muted-foreground">Set the rate window used to generate the schedule.</p>
        </div>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <NativeSelect
            value={period.periodType}
            onChange={(value) => onChange({ periodType: value as LoanRatePeriodType })}
            options={RATE_TYPE_OPTIONS}
          />
        </div>
        <div className="space-y-2">
          <Label>Annual rate (%)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={period.annualRate}
            onChange={(event) => onChange({ annualRate: event.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={period.startDate} onChange={(event) => onChange({ startDate: event.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={period.endDate} onChange={(event) => onChange({ endDate: event.target.value })} />
        </div>
      </div>

      {period.periodType === "floating" && (
        <div className="space-y-2">
          <Label>Repricing interval (months)</Label>
          <Input
            type="number"
            min={1}
            value={period.repricingIntervalMonths}
            onChange={(event) => onChange({ repricingIntervalMonths: event.target.value })}
            required
          />
        </div>
      )}
    </div>
  );
}

export function RatePeriodEditor({ ratePeriods, onAdd, onRemove, onChange }: RatePeriodEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Rate periods</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4 mr-1" />
          Add Period
        </Button>
      </div>
      <div className="space-y-3">
        {ratePeriods.map((period, index) => (
          <RatePeriodCard
            key={`${index}-${period.startDate}`}
            index={index}
            period={period}
            canRemove={ratePeriods.length > 1}
            onRemove={() => onRemove(index)}
            onChange={(patch) => onChange(index, patch)}
          />
        ))}
      </div>
    </div>
  );
}

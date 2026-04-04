"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TimeRange = "this-month" | "last-month" | "this-year" | "last-year" | "custom";

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  customRange: CustomDateRange;
  onCustomRangeChange: (range: CustomDateRange) => void;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "This month", value: "this-month" },
  { label: "Last month", value: "last-month" },
  { label: "This year", value: "this-year" },
  { label: "Last year", value: "last-year" },
  { label: "Custom", value: "custom" },
];

export function getDateRange(range: Exclude<TimeRange, "custom">): CustomDateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (range) {
    case "this-month": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "last-month": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "this-year": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "last-year": {
      const start = new Date(year - 1, 0, 1);
      const end = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
  }
}

export function TimeRangeSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 flex-wrap">
        {RANGES.map((r) => (
          <Button
            key={r.value}
            variant={value === r.value ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => onChange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {value === "custom" && (
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            className="h-7 text-[16px] md:text-xs px-2"
            value={customRange.startDate}
            onChange={(e) =>
              onCustomRangeChange({ ...customRange, startDate: e.target.value })
            }
          />
          <span className="text-xs text-muted-foreground shrink-0">to</span>
          <Input
            type="date"
            className="h-7 text-[16px] md:text-xs px-2"
            value={customRange.endDate}
            onChange={(e) =>
              onCustomRangeChange({ ...customRange, endDate: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}

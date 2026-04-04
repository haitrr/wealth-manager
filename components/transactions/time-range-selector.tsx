"use client";

import { Button } from "@/components/ui/button";

export type TimeRange = "this-month" | "last-month" | "this-year" | "last-year";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "This month", value: "this-month" },
  { label: "Last month", value: "last-month" },
  { label: "This year", value: "this-year" },
  { label: "Last year", value: "last-year" },
];

export function getDateRange(range: TimeRange): { startDate: string; endDate: string } {
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

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
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
  );
}

"use client";

import { Area, ComposedChart, Line, CartesianGrid, ReferenceLine, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { HistoryPoint } from "@/lib/api/networth-history";
import { Currency } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/utils";

interface NetWorthChartProps {
  data: HistoryPoint[];
  currency: Currency;
}

const SERIES = [
  { key: "liquid",      label: "Liquid",      color: "#22c55e" },
  { key: "assets",      label: "Assets",      color: "#f59e0b" },
  { key: "liabilities", label: "Liabilities", color: "#ef4444" },
  { key: "total",       label: "Net Worth",   color: "#3b82f6" },
] as const;

const chartConfig = Object.fromEntries(
  SERIES.map(s => [s.key, { label: s.label, color: s.color }])
);

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function CustomTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
  currency: Currency;
}) {
  if (!active || !payload?.length) return null;
  const ordered = SERIES.map(s => payload.find(p => p.name === s.key)).filter(Boolean) as typeof payload;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md text-xs min-w-40">
      <p className="mb-1.5 font-medium">{label != null ? formatDate(label) : ""}</p>
      {ordered.map(entry => {
        const series = SERIES.find(s => s.key === entry.name);
        const val = entry.name === "liabilities" ? -entry.value : entry.value;
        return (
          <div key={entry.name} className="flex items-center gap-2 justify-between py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full" style={{ background: entry.color }} />
              {series?.label ?? entry.name}
            </span>
            <span className="font-medium tabular-nums">{formatCurrency(val, currency)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function NetWorthChart({ data, currency }: NetWorthChartProps) {
  if (data.length < 2) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          No data yet. Add transactions to see your net worth over time.
        </p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: new Date(d.date + "T00:00:00").getTime(),
    total: d.total,
    liquid: d.liquid,
    assets: d.assets,
    liabilities: -d.liabilities, // negative so it stacks below zero
  }));

  return (
    <div className="rounded-lg border p-4">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={40}
            tickFormatter={formatDate}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={80}
            tickFormatter={v => formatCurrency(v, currency, true)}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend formatter={name => SERIES.find(s => s.key === name)?.label ?? name} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

          {/* Stacked positive: liquid (bottom) + assets (on top) */}
          <Area type="monotone"
dataKey="liquid"
stackId="pos"
            stroke="#22c55e"
fill="#22c55e"
fillOpacity={0.4}
strokeWidth={0} />
          <Area type="monotone"
dataKey="assets"
stackId="pos"
            stroke="#f59e0b"
fill="#f59e0b"
fillOpacity={0.4}
strokeWidth={0} />

          {/* Liabilities stacked below zero (negative values) */}
          <Area type="monotone"
dataKey="liabilities"
stackId="neg"
            stroke="#ef4444"
fill="#ef4444"
fillOpacity={0.4}
strokeWidth={0} />

          {/* Net worth as a line on top */}
          <Line type="monotone"
dataKey="total"
            stroke="#3b82f6"
strokeWidth={2.5}
dot={false} />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { HistoryPoint } from "@/lib/api/networth-history";
import { Currency } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/utils";

interface NetWorthChartProps {
  data: HistoryPoint[];
  currency: Currency;
}

const SERIES_LABELS: Record<string, string> = {
  total: "Net Worth",
  liquid: "Liquid",
  assets: "Assets",
  liabilities: "Liabilities",
};

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
    liabilities: d.liabilities,
  }));

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });

  const hasNegative = data.some(d => d.total < 0);

  const chartConfig = {
    total: { label: "Net Worth", color: "#3b82f6" },
  };

  return (
    <div className="rounded-lg border p-4">
      <ChartContainer config={chartConfig} className="h-52 w-full">
        <AreaChart data={chartData}>
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
            tickFormatter={v => formatCurrency(v, currency, true)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) =>
                  `${SERIES_LABELS[name as string] ?? name}: ${formatCurrency(Number(value), currency)}`
                }
                labelFormatter={label => formatDate(Number(label))}
              />
            }
          />
          {hasNegative && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />}
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

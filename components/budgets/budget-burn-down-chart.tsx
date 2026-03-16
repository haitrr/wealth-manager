"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface Transaction {
  id: string;
  date: string;
  amount: number;
}

interface BudgetBurnDownChartProps {
  periodStart: string;
  periodEnd: string;
  budgetAmount: number;
  currency: Currency;
  transactions: Transaction[];
  currentDate?: Date;
}

export function BudgetBurnDownChart({
  periodStart,
  periodEnd,
  budgetAmount,
  currency,
  transactions,
  currentDate = new Date(),
}: BudgetBurnDownChartProps) {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const now = currentDate > endDate ? endDate : currentDate;

  // Build cumulative spending data points
  const sortedTxs = [...transactions]
    .filter((tx) => new Date(tx.date) >= startDate && new Date(tx.date) <= endDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dataPoints: { date: Date; cumulative: number }[] = [{ date: startDate, cumulative: 0 }];
  let cumulative = 0;

  sortedTxs.forEach((tx) => {
    cumulative += tx.amount;
    const txDate = new Date(tx.date);
    // Check if we already have a point for this date
    const existing = dataPoints.find((p) => p.date.toDateString() === txDate.toDateString());
    if (existing) {
      existing.cumulative = cumulative;
    } else {
      dataPoints.push({ date: txDate, cumulative });
    }
  });

  // Add current date if not already present
  const hasCurrentDate = dataPoints.some((p) => p.date.toDateString() === now.toDateString());
  if (!hasCurrentDate && now > startDate) {
    dataPoints.push({ date: now, cumulative });
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Build chart data with both ideal and actual values using timestamps for linear scaling
  const chartDataMap = new Map<number, { date: number; ideal: number; actual: number | null }>();

  // Add start point
  chartDataMap.set(startDate.getTime(), {
    date: startDate.getTime(),
    ideal: 0,
    actual: 0,
  });

  // Add all actual spending points
  dataPoints.forEach((point) => {
    const ts = point.date.getTime();
    const elapsed = ts - startDate.getTime();
    const total = endDate.getTime() - startDate.getTime();
    const progress = Math.max(0, Math.min(1, elapsed / total));
    const ideal = progress * budgetAmount;

    chartDataMap.set(ts, {
      date: ts,
      ideal,
      actual: point.cumulative,
    });
  });

  // Add end point for ideal line
  const endTs = endDate.getTime();
  if (!chartDataMap.has(endTs)) {
    chartDataMap.set(endTs, {
      date: endTs,
      ideal: budgetAmount,
      actual: cumulative,
    });
  }

  // Convert to array and sort by timestamp
  const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date - b.date);

  const isOverBudget = cumulative > budgetAmount;

  const chartConfig = {
    ideal: {
      label: "Ideal",
      color: "#94a3b8",
    },
    actual: {
      label: "Actual",
      color: isOverBudget ? "#ef4444" : "#3b82f6",
    },
  };

  return (
    <div className="rounded-lg border p-4">
      <ChartContainer config={chartConfig} className="h-50 w-full">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={formatDate}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatCurrency(value, currency, true)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const label = name === "ideal" ? "Ideal" : "Actual";
                  return [`${formatCurrency(Number(value), currency)} `, label];
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={isOverBudget ? "#ef4444" : "#3b82f6"}
            strokeWidth={3}
            dot={{ fill: isOverBudget ? "#ef4444" : "#3b82f6", r: 4, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

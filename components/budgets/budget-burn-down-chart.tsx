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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Build chart data with both ideal and actual values
  // Start with the period start
  const chartDataMap = new Map<string, { date: string; ideal: number; actual: number | null }>();
  
  // Add start point
  const startKey = formatDate(startDate);
  chartDataMap.set(startKey, {
    date: startKey,
    ideal: 0,
    actual: 0,
  });

  // Add all actual spending points
  dataPoints.forEach((point) => {
    const dateStr = formatDate(point.date);
    const elapsed = point.date.getTime() - startDate.getTime();
    const total = endDate.getTime() - startDate.getTime();
    const progress = Math.max(0, Math.min(1, elapsed / total));
    const ideal = progress * budgetAmount;

    chartDataMap.set(dateStr, {
      date: dateStr,
      ideal,
      actual: point.cumulative,
    });
  });

  // Add end point for ideal line
  const endKey = formatDate(endDate);
  if (!chartDataMap.has(endKey)) {
    chartDataMap.set(endKey, {
      date: endKey,
      ideal: budgetAmount,
      actual: cumulative,
    });
  }

  // Convert to array and sort by date
  const chartData = Array.from(chartDataMap.values());

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
      <h3 className="text-sm font-medium mb-3">Burn Down Chart</h3>
      <ChartContainer config={chartConfig} className="h-50 w-full">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
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

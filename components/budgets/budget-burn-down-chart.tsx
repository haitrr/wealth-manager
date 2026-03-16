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

type ChartPoint = { date: number; ideal: number; actual: number | null; projection: number | null };

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

  // Calculate projection for remaining period
  const nowTs = now.getTime();
  const passedDays = (nowTs - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const avgDailySpend = passedDays > 0 ? cumulative / passedDays : 0;
  const remainingDays = (endDate.getTime() - nowTs) / (1000 * 60 * 60 * 24);
  const projectedEnd = cumulative + avgDailySpend * remainingDays;
  const showProjection = currentDate < endDate;

  // Build chart data with ideal, actual, and projection values
  const chartDataMap = new Map<number, ChartPoint>();

  // Add start point
  chartDataMap.set(startDate.getTime(), {
    date: startDate.getTime(),
    ideal: 0,
    actual: 0,
    projection: null,
  });

  // Add all actual spending points
  dataPoints.forEach((point) => {
    const ts = point.date.getTime();
    const elapsed = ts - startDate.getTime();
    const total = endDate.getTime() - startDate.getTime();
    const progress = Math.max(0, Math.min(1, elapsed / total));
    const ideal = progress * budgetAmount;
    const isNow = point.date.toDateString() === now.toDateString();

    chartDataMap.set(ts, {
      date: ts,
      ideal,
      actual: point.cumulative,
      projection: showProjection && isNow ? point.cumulative : null,
    });
  });

  // Add end point for ideal line and projection
  const endTs = endDate.getTime();
  if (!chartDataMap.has(endTs)) {
    chartDataMap.set(endTs, {
      date: endTs,
      ideal: budgetAmount,
      actual: showProjection ? null : cumulative,
      projection: showProjection ? projectedEnd : null,
    });
  } else {
    const existing = chartDataMap.get(endTs)!;
    existing.projection = showProjection ? projectedEnd : null;
  }

  // Convert to array and sort by timestamp
  const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date - b.date);

  const isOverBudget = cumulative > budgetAmount;
  const isProjectedOverBudget = projectedEnd > budgetAmount;

  const chartConfig = {
    ideal: { label: "Ideal", color: "#94a3b8" },
    actual: { label: "Actual", color: isOverBudget ? "#ef4444" : "#3b82f6" },
    projection: { label: "Projected", color: isProjectedOverBudget ? "#f97316" : "#3b82f6" },
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
                  const label = name === "ideal" ? "Ideal" : name === "projection" ? "Projected" : "Actual";
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
          {showProjection && (
            <Line
              type="monotone"
              dataKey="projection"
              stroke={isProjectedOverBudget ? "#f97316" : "#3b82f6"}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

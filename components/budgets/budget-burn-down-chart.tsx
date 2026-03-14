"use client";

import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";

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

  // Chart dimensions
  const width = 320;
  const height = 200;
  const padding = { top: 20, right: 10, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scales
  const maxAmount = Math.max(budgetAmount, cumulative) * 1.1;
  const xScale = (date: Date) => {
    const elapsed = date.getTime() - startDate.getTime();
    const total = endDate.getTime() - startDate.getTime();
    return padding.left + (elapsed / total) * chartWidth;
  };
  const yScale = (amount: number) => {
    return padding.top + chartHeight - (amount / maxAmount) * chartHeight;
  };

  // Ideal spending line (linear)
  const idealPath = `M ${xScale(startDate)},${yScale(0)} L ${xScale(endDate)},${yScale(budgetAmount)}`;

  // Actual spending line
  const actualPath = dataPoints.map((p, i) => {
    const x = xScale(p.date);
    const y = yScale(p.cumulative);
    return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
  }).join(" ");

  // Y-axis ticks
  const yTicks = [0, budgetAmount / 2, budgetAmount, maxAmount].filter((v, i, arr) => arr.indexOf(v) === i);

  // X-axis ticks (start, middle, end)
  const midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);
  const xTicks = [
    { date: startDate, label: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
    { date: midDate, label: midDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
    { date: endDate, label: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
  ];

  const isOverBudget = cumulative > budgetAmount;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium mb-3">Burn Down Chart</h3>
      <svg width={width} height={height} className="text-xs">
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeOpacity={0.2}
        />
        {/* Y-axis ticks */}
        {yTicks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left - 4}
                y1={y}
                x2={padding.left}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.3}
              />
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                fill="currentColor"
                className="text-[10px] fill-muted-foreground"
              >
                {formatCurrency(tick, currency, true)}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeOpacity={0.2}
        />
        {/* X-axis ticks */}
        {xTicks.map((tick) => {
          const x = xScale(tick.date);
          return (
            <g key={tick.label}>
              <line
                x1={x}
                y1={height - padding.bottom}
                x2={x}
                y2={height - padding.bottom + 4}
                stroke="currentColor"
                strokeOpacity={0.3}
              />
              <text
                x={x}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fill="currentColor"
                className="text-[10px] fill-muted-foreground"
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* Ideal spending line */}
        <path
          d={idealPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray="4 4"
          className="stroke-muted-foreground"
          opacity={0.5}
        />

        {/* Actual spending line */}
        <path
          d={actualPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={isOverBudget ? "stroke-destructive" : "stroke-primary"}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={xScale(p.date)}
            cy={yScale(p.cumulative)}
            r={3}
            fill="currentColor"
            className={isOverBudget ? "fill-destructive" : "fill-primary"}
          />
        ))}

        {/* Current date marker */}
        {now > startDate && now < endDate && (
          <line
            x1={xScale(now)}
            y1={padding.top}
            x2={xScale(now)}
            y2={height - padding.bottom}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="2 2"
            className="stroke-muted-foreground"
            opacity={0.3}
          />
        )}
      </svg>

      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-muted-foreground opacity-50" style={{ borderTop: "2px dashed" }} />
          <span>Ideal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-6 h-0.5 ${isOverBudget ? "bg-destructive" : "bg-primary"}`} />
          <span>Actual</span>
        </div>
      </div>
    </div>
  );
}

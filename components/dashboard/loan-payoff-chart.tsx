"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Loan } from "@/lib/api/loans";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LoanPayoffChartProps {
  loan: Loan;
}

export function LoanPayoffChart({ loan }: LoanPayoffChartProps) {
  if (loan.scheduleEntries.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Payoff Projection</h2>
        <p className="text-sm text-muted-foreground">No schedule data for this loan yet.</p>
      </div>
    );
  }

  const chartData = loan.scheduleEntries.reduce<Array<{
    installment: number;
    dueDate: string;
    remainingPrincipal: number;
    cumulativeInterest: number;
  }>>((rows, entry) => {
    const previousCumulativeInterest = rows[rows.length - 1]?.cumulativeInterest ?? 0;
    rows.push({
      installment: entry.installmentIndex,
      dueDate: new Date(entry.dueDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      remainingPrincipal: entry.closingPrincipal,
      cumulativeInterest: previousCumulativeInterest + entry.scheduledInterest,
    });
    return rows;
  }, []);

  const chartConfig = {
    remainingPrincipal: {
      label: "Remaining principal",
      color: "#f59e0b",
    },
    cumulativeInterest: {
      label: "Cumulative interest",
      color: "#10b981",
    },
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">Payoff Projection</h2>
        <p className="text-xs text-muted-foreground">Remaining principal and cumulative interest across the generated schedule.</p>
      </div>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="installment"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value) => String(value)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatCurrency(Number(value), loan.currency, true)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => payload?.[0]?.payload?.dueDate ?? ""}
                formatter={(value, name) => [
                  `${formatCurrency(Number(value), loan.currency)} `,
                  name === "remainingPrincipal" ? "Remaining principal" : "Cumulative interest",
                ]}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="remainingPrincipal"
            stroke="var(--color-remainingPrincipal)"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="cumulativeInterest"
            stroke="var(--color-cumulativeInterest)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

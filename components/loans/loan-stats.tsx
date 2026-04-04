"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Loan } from "@/lib/api/loans";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LoanStatsProps {
  loan: Loan;
}

export function LoanStats({ loan }: LoanStatsProps) {
  const sortedPayments = [...loan.payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );

  const totalPrincipalPaid = sortedPayments.reduce((s, p) => s + (p.principalTransaction?.amount ?? 0), 0);
  const totalInterestPaid = sortedPayments.reduce((s, p) => s + (p.interestTransaction?.amount ?? 0), 0);
  const totalFeesPaid = sortedPayments.reduce((s, p) => s + (p.prepayFeeTransaction?.amount ?? 0), 0);
  const totalCost = totalInterestPaid + totalFeesPaid;

  const startDate = new Date(loan.startDate);
  const today = new Date();
  const daysActive = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Build principal balance over time for area chart
  const balanceData: { date: number; remaining: number }[] = [
    { date: startDate.getTime(), remaining: loan.principalAmount },
  ];
  let runningBalance = loan.principalAmount;
  for (const p of sortedPayments) {
    runningBalance -= (p.principalTransaction?.amount ?? 0);
    balanceData.push({
      date: new Date(p.paymentDate).getTime(),
      remaining: Math.max(0, runningBalance),
    });
  }

  // Bar chart data per payment
  const paymentBreakdown = sortedPayments.map((p) => ({
    date: new Date(p.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    principal: p.principalTransaction?.amount ?? 0,
    interest: p.interestTransaction?.amount ?? 0,
    fee: p.prepayFeeTransaction?.amount ?? 0,
  }));

  const accentColor = loan.direction === "borrowed" ? "#f59e0b" : "#10b981";

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Interest</p>
          <p className="text-sm font-semibold">{formatCurrency(totalInterestPaid, loan.currency)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Fees</p>
          <p className="text-sm font-semibold">{formatCurrency(totalFeesPaid, loan.currency)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Cost of Loan</p>
          <p className="text-sm font-semibold">{formatCurrency(totalCost, loan.currency)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Days Active</p>
          <p className="text-sm font-semibold">{daysActive.toLocaleString()}</p>
        </div>
      </div>

      {/* Principal balance over time */}
      {balanceData.length > 1 && (
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Principal Balance</h3>
          <ChartContainer
            config={{ remaining: { label: "Remaining", color: accentColor } }}
            className="h-40 w-full"
          >
            <AreaChart data={balanceData}>
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
                tickFormatter={(v) => formatCurrency(v, loan.currency, true)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(v) => formatCurrency(Number(v), loan.currency)} />
                }
              />
              <Area
                type="monotone"
                dataKey="remaining"
                stroke={accentColor}
                fill={accentColor}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      {/* Per-payment breakdown bar chart */}
      {paymentBreakdown.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Payment Breakdown</h3>
          <ChartContainer
            config={{
              principal: { label: "Principal", color: accentColor },
              interest: { label: "Interest", color: "#6366f1" },
              fee: { label: "Fee", color: "#f43f5e" },
            }}
            className="h-40 w-full"
          >
            <BarChart data={paymentBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => formatCurrency(v, loan.currency, true)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(v) => formatCurrency(Number(v), loan.currency)} />
                }
              />
              <Bar dataKey="principal" stackId="a" fill={accentColor} radius={[0, 0, 0, 0]} />
              <Bar dataKey="interest" stackId="a" fill="#6366f1" />
              <Bar dataKey="fee" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}

"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface DailyData {
  date: string;
  balance: number;
  income: number;
  expenses: number;
}

interface BalanceTrendChartProps {
  dailyData: DailyData[];
  currency: Currency;
}

export function BalanceTrendChart({ dailyData, currency }: BalanceTrendChartProps) {
  if (dailyData.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-3">Balance Trend</h3>
        <p className="text-sm text-muted-foreground">No transaction data for this month yet.</p>
      </div>
    );
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const mapped = dailyData.map((d) => ({
    date: new Date(d.date + "T00:00:00").getTime(),
    balance: d.balance,
  }));

  const DAY_MS = 86400000;
  const chartData = [{ date: mapped[0].date - DAY_MS, balance: 0 }, ...mapped];

  const hasNegative = dailyData.some((d) => d.balance < 0);

  const chartConfig = {
    balance: {
      label: "Balance",
      color: "#3b82f6",
    },
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium mb-3">Balance Trend</h3>
      <ChartContainer config={chartConfig} className="h-50 w-full">
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
                formatter={(value) => formatCurrency(Number(value), currency)}
                labelKey="date"
              />
            }
          />
          {hasNegative && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />}
          <Area
            type="monotone"
            dataKey="balance"
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

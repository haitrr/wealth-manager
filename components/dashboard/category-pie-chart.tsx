"use client";

import { Pie, PieChart, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CategoryData {
  name: string;
  amount: number;
}

interface CategoryPieChartProps {
  title: string;
  data: CategoryData[];
  currency: Currency;
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f97316",
  "hsl(var(--chart-5))",
];

function CustomLegend({
  chartData,
  currency,
}: {
  chartData: Array<{ name: string; value: number; percentage: string }>;
  currency: Currency;
}) {
  return (
    <div className="space-y-2 mt-4">
      {chartData.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <span className="flex-1 truncate">{entry.name}</span>
          <span className="font-medium whitespace-nowrap">{entry.percentage}%</span>
          <span className="text-muted-foreground whitespace-nowrap">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CategoryPieChart({ title, data, currency }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground">No data for this month yet.</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // Sort by amount descending
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  const chartData = sortedData.map((item) => ({
    name: item.name,
    value: item.amount,
    percentage: ((item.amount / total) * 100).toFixed(1),
  }));

  const chartConfig = sortedData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <ChartContainer config={chartConfig} className="h-50 w-full">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [`${formatCurrency(Number(value), currency)} `, name]}
                hideLabel
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <CustomLegend chartData={chartData} currency={currency} />
    </div>
  );
}

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
    <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
      {chartData.map((entry, index) => (
        <div key={entry.name} className="flex items-center justify-between gap-1.5 text-xs min-w-0">
          <div
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <span className="truncate flex-1">{entry.name}</span>
          <span className="text-muted-foreground whitespace-nowrap shrink-0">{entry.percentage}%</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryPieChart({ title, data, currency }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-3">
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground">No data for this period.</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // Sort by amount descending, take top 5, group rest as "Other"
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);
  const top5 = sortedData.slice(0, 5);
  const rest = sortedData.slice(5);
  const otherAmount = rest.reduce((sum, d) => sum + d.amount, 0);

  const displayData = otherAmount > 0 ? [...top5, { name: "Other", amount: otherAmount }] : top5;

  const chartData = displayData.map((item) => ({
    name: item.name,
    value: item.amount,
    percentage: ((item.amount / total) * 100).toFixed(1),
  }));

  const chartConfig = displayData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <div className="rounded-lg border p-3">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="flex items-center gap-6">
        <ChartContainer config={chartConfig} className="h-28 w-28 shrink-0">
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
              innerRadius={30}
              outerRadius={52}
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
    </div>
  );
}

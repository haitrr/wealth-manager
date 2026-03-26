"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBudgets } from "@/lib/api/budgets";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function BudgetOverview() {
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });

  const top5 = [...budgets]
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 5);

  if (isLoading) return null;
  if (top5.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Top Budgets</p>
          <Link href="/budgets" className="text-xs text-primary">View all</Link>
        </div>
        {top5.map((budget) => {
          const percent = Math.min(100, budget.percentUsed);
          const isOver = budget.spent > budget.amount;
          return (
            <Link key={budget.id} href={`/budgets/${budget.id}`} className="block space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate flex-1 font-medium">{budget.name}</span>
                <span className={`ml-2 shrink-0 ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
                  {Math.round(budget.percentUsed)}%
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{formatCurrency(budget.spent, budget.currency)}</span>
                <span>{formatCurrency(budget.amount, budget.currency)}</span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

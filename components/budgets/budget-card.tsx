"use client";

import Link from "next/link";
import { Budget } from "@/lib/api/budgets";
import { formatCurrency } from "@/lib/utils";

interface BudgetCardProps {
  budget: Budget;
}

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
};

export function BudgetCard({ budget }: BudgetCardProps) {
  const percent = Math.min(100, budget.percentUsed);
  const isOver = budget.spent > budget.amount;
  const currency = budget.currency;

  return (
    <Link
      href={`/budgets/${budget.id}`}
      className="block rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{budget.name}</p>
        <p className="text-xs text-muted-foreground">
          {PERIOD_LABELS[budget.period]}
          {budget.account ? ` · ${budget.account.name}` : ""}
          {budget.category ? ` · ${budget.category.name}` : ""}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={isOver ? "text-destructive font-medium" : "text-muted-foreground"}>
            {formatCurrency(budget.spent, currency)} spent
          </span>
          <span className="text-muted-foreground">{formatCurrency(budget.amount, currency)} budget</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-muted-foreground">Avg/day</p>
          <p className="font-medium">{formatCurrency(budget.avgSpentPerDay, currency)}</p>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-muted-foreground">
            {budget.daysRemaining > 0 ? `${budget.daysRemaining}d left · suggested` : "Period ended"}
          </p>
          <p className={`font-medium ${budget.suggestedDailySpend < 0 ? "text-destructive" : ""}`}>
            {budget.daysRemaining > 0 ? `${formatCurrency(Math.max(0, budget.suggestedDailySpend), currency)}/day` : "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}

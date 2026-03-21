"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";
import { TransactionCategory } from "@/lib/api/transaction-categories";
import { Transaction } from "@/lib/api/transactions";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#f43f5e", "#a855f7", "#14b8a6",
];

interface Props {
  transactions: Transaction[];
  categories: TransactionCategory[];
  currency: Currency;
}

interface SliceData {
  categoryId: string;
  name: string;
  value: number;
  hasChildren: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SliceData; value: number }>;
  currency: Currency;
  total: number;
}

function CustomTooltip({ active, payload, currency, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow text-sm">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{formatCurrency(value, currency)} · {pct}%</p>
    </div>
  );
}

export function BudgetCategoryPieChart({ transactions, categories, currency }: Props) {
  const [drillPath, setDrillPath] = useState<string[]>([]);

  const catById = new Map(categories.map((c) => [c.id, c]));

  function getAncestorUnder(categoryId: string, parentId: string | null): string | null {
    if (categoryId === parentId) return categoryId;
    let cur = catById.get(categoryId);
    while (cur) {
      if (cur.parentId === parentId || (parentId === null && !cur.parentId)) {
        return cur.id;
      }
      cur = cur.parentId ? catById.get(cur.parentId) : undefined;
    }
    if (parentId === null) {
      // walk up fully to get root
      let root = catById.get(categoryId);
      while (root?.parentId) root = catById.get(root.parentId);
      return root?.id ?? null;
    }
    return null;
  }

  function groupAt(parentId: string | null): SliceData[] {
    const grouped = new Map<string, { total: number; txs: Transaction[] }>();
    for (const tx of transactions) {
      const ancestor = getAncestorUnder(tx.category.id, parentId);
      if (!ancestor) continue;
      const entry = grouped.get(ancestor) ?? { total: 0, txs: [] };
      entry.total += tx.amount;
      entry.txs.push(tx);
      grouped.set(ancestor, entry);
    }
    return Array.from(grouped.entries())
      .map(([categoryId, { total: value, txs }]) => ({
        categoryId,
        name: catById.get(categoryId)?.name ?? "Unknown",
        value,
        hasChildren: txs.some((tx) => tx.category.id !== categoryId),
      }))
      .sort((a, b) => b.value - a.value);
  }

  // Starting from the user's drill path, auto-advance through single-slice levels
  const effectivePath = [...drillPath];
  let slices = groupAt(effectivePath.length > 0 ? effectivePath[effectivePath.length - 1] : null);
  while (slices.length === 1 && slices[0].hasChildren) {
    effectivePath.push(slices[0].categoryId);
    slices = groupAt(slices[0].categoryId);
  }

  const total = slices.reduce((s, d) => s + d.value, 0);

  if (slices.length === 0) return null;

  const breadcrumb = effectivePath.map((id) => catById.get(id)?.name ?? id);

  return (
    <div className="rounded-lg border p-4 mt-6">
      {/* Breadcrumb */}
      {effectivePath.length > 0 && (
        <div className="flex items-center gap-1 text-sm mb-3 flex-wrap">
          <button className="text-muted-foreground hover:underline" onClick={() => setDrillPath([])}>
            All categories
          </button>
          {breadcrumb.map((name, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="size-3 text-muted-foreground" />
              <button
                className={`hover:underline ${i === breadcrumb.length - 1 ? "font-medium" : "text-muted-foreground"}`}
                onClick={() => setDrillPath(effectivePath.slice(0, i + 1))}
              >
                {name}
              </button>
            </span>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            onClick={(data: SliceData) => {
              if (data.hasChildren) setDrillPath([...effectivePath, data.categoryId]);
            }}
            style={{ cursor: "pointer" }}
          >
            {slices.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} total={total} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 space-y-1">
        {slices.map((s, i) => (
          <div
            key={s.categoryId}
            className={`flex items-center gap-2 text-sm ${s.hasChildren ? "cursor-pointer hover:bg-muted/50 rounded px-1" : "px-1"}`}
            onClick={() => s.hasChildren && setDrillPath([...effectivePath, s.categoryId])}
          >
            <span className="size-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{s.name}</span>
            {s.hasChildren && <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
            <span className="text-muted-foreground tabular-nums">{formatCurrency(s.value, currency)}</span>
            <span className="text-muted-foreground tabular-nums w-12 text-right">
              {total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

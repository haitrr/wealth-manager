"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getNetWorth,
  NetWorthResponse,
  AssetItem,
  AccountItem,
  LoanItem,
} from "@/lib/api/networth";
import { getNetWorthHistory, NetWorthRange } from "@/lib/api/networth-history";
import { NetWorthChart } from "@/components/networth/net-worth-chart";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate",
  stock: "Stocks",
  bond: "Bonds",
  gold: "Gold",
};

const RANGES: { label: string; value: NetWorthRange }[] = [
  { label: "All", value: "all" },
  { label: "1Y", value: "1y" },
  { label: "6M", value: "6m" },
  { label: "3M", value: "3m" },
  { label: "1M", value: "1m" },
];

function SectionCard({
  title,
  total,
  currency,
  children,
  href,
}: {
  title: string;
  total: number;
  currency: Currency;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatCurrency(total, currency)}</span>
          {href && (
            <Link href={href} className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  currency,
  sub,
}: {
  label: string;
  value: number;
  currency: Currency;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div>
        <p className="text-sm">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <p className="text-sm font-medium">{formatCurrency(value, currency)}</p>
    </div>
  );
}

function AssetsBreakdown({
  data,
  currency,
}: {
  data: NetWorthResponse["assets"];
  currency: Currency;
}) {
  return (
    <>
      {(
        Object.entries(data.byType) as [
          string,
          { total: number; items: AssetItem[] },
        ][]
      )
        .filter(([, v]) => v.items.length > 0)
        .map(([type, group]) => (
          <div key={type}>
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">
                {ASSET_TYPE_LABELS[type]}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {formatCurrency(group.total, currency)}
              </p>
            </div>
            {group.items.map(item => (
              <Row
                key={item.id}
                label={item.name}
                value={item.valueInTarget}
                currency={currency}
                sub={
                  item.ticker
                    ? `${item.ticker} · qty ${item.quantity}`
                    : undefined
                }
              />
            ))}
          </div>
        ))}
    </>
  );
}

export default function NetWorthPage() {
  const [range, setRange] = useState<NetWorthRange>("all");

  const { data, isLoading, error } = useQuery<NetWorthResponse>({
    queryKey: ["networth"],
    queryFn: getNetWorth,
  });

  const { data: historyData = [], isLoading: historyLoading } = useQuery({
    queryKey: ["networth-history", range],
    queryFn: () => getNetWorthHistory(range),
  });

  const currency = data?.currency ?? "USD";

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-semibold mb-6">Net Worth</h1>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && error && (
        <p className="text-sm text-destructive">Unable to load net worth.</p>
      )}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4 px-4">
              <p className="text-xs text-muted-foreground">Total Net Worth</p>
              <p
                className={`text-3xl font-bold tracking-tight mt-1 ${
                  data.totalNetWorth >= 0 ? "" : "text-destructive"
                }`}
              >
                {formatCurrency(data.totalNetWorth, currency)}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Liquid</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(data.liquid.total, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Assets</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.assets.total, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Liabilities</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(data.liabilities.total, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex gap-1">
              {RANGES.map(r => (
                <Button
                  key={r.value}
                  variant={range === r.value ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setRange(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
            {historyLoading ? (
              <div className="rounded-lg border p-4 h-60 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading…</p>
              </div>
            ) : (
              <NetWorthChart data={historyData} currency={currency} />
            )}
          </div>

          {data.missingRates.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <span>
                Missing exchange rates for: {data.missingRates.join(", ")}. Some
                values shown unconverted.
              </span>
            </div>
          )}

          <SectionCard
            title="Liquid"
            total={data.liquid.total}
            currency={currency}
            href="/settings/accounts"
          >
            {data.liquid.accounts.map((a: AccountItem) => (
              <Row
                key={a.id}
                label={a.name}
                value={a.valueInTarget}
                currency={currency}
                sub={
                  a.currency !== currency
                    ? formatCurrency(a.balance, a.currency)
                    : undefined
                }
              />
            ))}
          </SectionCard>

          {data.assets.total > 0 && (
            <SectionCard
              title="Assets"
              total={data.assets.total}
              currency={currency}
              href="/assets"
            >
              <AssetsBreakdown
                data={data.assets}
                currency={currency}
              />
            </SectionCard>
          )}

          {data.liabilities.total > 0 && (
            <SectionCard
              title="Liabilities"
              total={data.liabilities.total}
              currency={currency}
              href="/loans"
            >
              {data.liabilities.loans.map((l: LoanItem) => (
                <Row
                  key={l.id}
                  label={l.name}
                  value={l.valueInTarget}
                  currency={currency}
                  sub={
                    l.currency !== currency
                      ? `${formatCurrency(l.outstandingPrincipal, l.currency)} outstanding`
                      : "outstanding"
                  }
                />
              ))}
            </SectionCard>
          )}
        </div>
      )}
    </main>
  );
}

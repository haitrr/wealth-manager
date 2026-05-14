# Default Display Currency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users set a preferred display currency so all monetary summaries (home dashboard, net worth) convert values to it.

**Architecture:** `defaultCurrency` is stored in `UserSettings`. The `/api/networth` endpoint reads it server-side and converts all values before responding. The home page reads the setting via an existing React Query fetch and uses it as the conversion target for client-side total balance calculation.

**Tech Stack:** Next.js App Router, Prisma (PostgreSQL), React Query, shadcn/ui

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `defaultCurrency` field to `UserSettings` |
| Modify | `app/api/settings/route.ts` | Allow `defaultCurrency` in PUT |
| Modify | `lib/api/settings.ts` | Add `defaultCurrency` to client types |
| Modify | `app/api/networth/route.ts` | Read `defaultCurrency`, convert server-side, return `currency` in response |
| Modify | `lib/api/networth.ts` | Add `currency` field to `NetWorthResponse` |
| Modify | `app/networth/page.tsx` | Use `data.currency` instead of hardcoded `"USD"` |
| Modify | `app/page.tsx` | Fetch settings, use `defaultCurrency` as display currency |
| Modify | `app/settings/page.tsx` | Add inline currency selector |

---

## Task 1: Prisma Schema — Add `defaultCurrency` to `UserSettings`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the field**

In `prisma/schema.prisma`, add `defaultCurrency` to the `UserSettings` model after the existing `userId` fields:

```prisma
model UserSettings {
  id                              String   @id @default(cuid())
  userId                          String   @unique
  user                            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  defaultCurrency                 Currency @default(USD)
  loanBorrowedInitialCategoryId   String?
  loanBorrowedPrincipalCategoryId String?
  loanBorrowedInterestCategoryId  String?
  loanBorrowedPrepayFeeCategoryId String?
  loanLentInitialCategoryId       String?
  loanLentPrincipalCategoryId     String?
  loanLentInterestCategoryId      String?
  loanLentPrepayFeeCategoryId     String?
  createdAt                       DateTime @default(now())
  updatedAt                       DateTime @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm prisma migrate dev --name add-default-currency
```

Expected: migration file created, Prisma client regenerated, no errors.

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add defaultCurrency to UserSettings"
```

---

## Task 2: Settings API — Allow `defaultCurrency` in PUT

**Files:**
- Modify: `app/api/settings/route.ts`

- [ ] **Step 1: Add `defaultCurrency` to the allowed fields list**

In `app/api/settings/route.ts`, update the `allowed` array:

```typescript
const allowed = [
  "defaultCurrency",
  "loanBorrowedInitialCategoryId",
  "loanBorrowedPrincipalCategoryId",
  "loanBorrowedInterestCategoryId",
  "loanBorrowedPrepayFeeCategoryId",
  "loanLentInitialCategoryId",
  "loanLentPrincipalCategoryId",
  "loanLentInterestCategoryId",
  "loanLentPrepayFeeCategoryId",
] as const;
```

Also update the `data` type to accept `Currency` values, not just `string | null`:

```typescript
const data: Record<string, string | null> = {};
for (const key of allowed) {
  if (key in body) {
    data[key] = body[key] || null;
  }
}
```

This already works for `defaultCurrency` since Prisma will validate the enum value. No additional change needed.

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/route.ts
git commit -m "feat: allow defaultCurrency in settings API"
```

---

## Task 3: Settings Client Types

**Files:**
- Modify: `lib/api/settings.ts`

- [ ] **Step 1: Add `defaultCurrency` to the `UserSettings` interface and payload**

Replace the existing content of `lib/api/settings.ts`:

```typescript
import api from "@/lib/axios";
import { Currency } from "./accounts";

export interface UserSettings {
  id: string;
  userId: string;
  defaultCurrency: Currency;
  loanBorrowedInitialCategoryId: string | null;
  loanBorrowedPrincipalCategoryId: string | null;
  loanBorrowedInterestCategoryId: string | null;
  loanBorrowedPrepayFeeCategoryId: string | null;
  loanLentInitialCategoryId: string | null;
  loanLentPrincipalCategoryId: string | null;
  loanLentInterestCategoryId: string | null;
  loanLentPrepayFeeCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserSettingsPayload = Partial<Pick<
  UserSettings,
  | "defaultCurrency"
  | "loanBorrowedInitialCategoryId"
  | "loanBorrowedPrincipalCategoryId"
  | "loanBorrowedInterestCategoryId"
  | "loanBorrowedPrepayFeeCategoryId"
  | "loanLentInitialCategoryId"
  | "loanLentPrincipalCategoryId"
  | "loanLentInterestCategoryId"
  | "loanLentPrepayFeeCategoryId"
>>;

export async function getSettings(): Promise<UserSettings> {
  const { data } = await api.get<UserSettings>("/settings");
  return data;
}

export async function updateSettings(payload: UserSettingsPayload): Promise<UserSettings> {
  const { data } = await api.put<UserSettings>("/settings", payload);
  return data;
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/api/settings.ts
git commit -m "feat: add defaultCurrency to settings client types"
```

---

## Task 4: Net Worth API — Server-side Conversion with `defaultCurrency`

**Files:**
- Modify: `app/api/networth/route.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { Currency } from "@prisma/client";

function convertToCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: { fromCurrency: string; toCurrency: string; rate: number }[]
): number {
  if (fromCurrency === toCurrency) return amount;
  const direct = rates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
  if (direct) return amount * direct.rate;
  const inverse = rates.find(r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency);
  if (inverse) return amount / inverse.rate;
  return amount;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, accounts, assets, loans, exchangeRates] = await Promise.all([
    prisma.userSettings.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    }),
    prisma.account.findMany({ where: { userId: session.userId } }),
    prisma.asset.findMany({ where: { userId: session.userId } }),
    prisma.loan.findMany({
      where: { userId: session.userId, status: "active" },
      include: {
        initialTransaction: { select: { amount: true } },
        payments: {
          include: {
            principalTransaction: { select: { amount: true } },
          },
        },
      },
    }),
    prisma.exchangeRate.findMany({ where: { userId: session.userId } }),
  ]);

  const targetCurrency = settings.defaultCurrency;
  const missingRates: string[] = [];

  function convert(amount: number, fromCurrency: Currency): number {
    const result = convertToCurrency(amount, fromCurrency, targetCurrency, exchangeRates);
    if (fromCurrency !== targetCurrency && result === amount) {
      missingRates.push(`${fromCurrency}/${targetCurrency}`);
    }
    return result;
  }

  const accountItems = accounts.map(a => ({
    id: a.id,
    name: a.name,
    balance: a.balance,
    currency: a.currency,
    valueInTarget: convert(a.balance, a.currency),
  }));

  const assetItems = assets.map(a => ({
    ...a,
    valueInTarget: convert(a.currentValue, a.currency),
  }));

  const loanItems = loans.map(loan => {
    const principalAmount = loan.initialTransaction?.amount ?? 0;
    const paidPrincipal = loan.payments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
    const outstandingPrincipal = Math.max(0, principalAmount - paidPrincipal);
    return {
      id: loan.id,
      name: loan.name,
      direction: loan.direction,
      outstandingPrincipal,
      currency: loan.currency,
      valueInTarget: convert(outstandingPrincipal, loan.currency),
    };
  });

  const borrowedLoans = loanItems.filter(l => l.direction === "borrowed");

  const liquidTotal = accountItems.reduce((s, a) => s + a.valueInTarget, 0);
  const assetsByType = {
    real_estate: assetItems.filter(a => a.type === "real_estate"),
    stock: assetItems.filter(a => a.type === "stock"),
    bond: assetItems.filter(a => a.type === "bond"),
    gold: assetItems.filter(a => a.type === "gold"),
  };
  const assetsTotal = assetItems.reduce((s, a) => s + a.valueInTarget, 0);
  const liabilitiesTotal = borrowedLoans.reduce((s, l) => s + l.valueInTarget, 0);

  return NextResponse.json({
    currency: targetCurrency,
    totalNetWorth: liquidTotal + assetsTotal - liabilitiesTotal,
    missingRates: [...new Set(missingRates)],
    liquid: { total: liquidTotal, accounts: accountItems },
    assets: {
      total: assetsTotal,
      byType: {
        real_estate: { total: assetsByType.real_estate.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.real_estate },
        stock: { total: assetsByType.stock.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.stock },
        bond: { total: assetsByType.bond.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.bond },
        gold: { total: assetsByType.gold.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.gold },
      },
    },
    liabilities: { total: liabilitiesTotal, loans: borrowedLoans },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/networth/route.ts
git commit -m "feat: use defaultCurrency in net worth API"
```

---

## Task 5: Net Worth Client Types — Add `currency` to Response

**Files:**
- Modify: `lib/api/networth.ts`

- [ ] **Step 1: Update `AccountItem`, `AssetItem`, `LoanItem` and `NetWorthResponse`**

The API now returns `valueInTarget` instead of `valueInUsd`. Update `lib/api/networth.ts`:

```typescript
import api from "@/lib/axios";
import { Currency } from "./accounts";
import { AssetType } from "./assets";

export interface AccountItem {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
  valueInTarget: number;
}

export interface AssetItem {
  id: string;
  name: string;
  type: AssetType;
  currency: Currency;
  currentValue: number;
  quantity: number | null;
  ticker: string | null;
  lastPricedAt: string | null;
  valueInTarget: number;
}

export interface LoanItem {
  id: string;
  name: string;
  direction: "borrowed" | "lent";
  outstandingPrincipal: number;
  currency: Currency;
  valueInTarget: number;
}

export interface AssetsByType {
  real_estate: { total: number; items: AssetItem[] };
  stock: { total: number; items: AssetItem[] };
  bond: { total: number; items: AssetItem[] };
  gold: { total: number; items: AssetItem[] };
}

export interface NetWorthResponse {
  currency: Currency;
  totalNetWorth: number;
  missingRates: string[];
  liquid: { total: number; accounts: AccountItem[] };
  assets: { total: number; byType: AssetsByType };
  liabilities: { total: number; loans: LoanItem[] };
}

export async function getNetWorth(): Promise<NetWorthResponse> {
  const { data } = await api.get<NetWorthResponse>("/networth");
  return data;
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: type errors in `app/networth/page.tsx` referencing old `valueInUsd` field — these get fixed in the next task.

- [ ] **Step 3: Commit after next task passes type-check** (skip this commit, continue to Task 6)

---

## Task 6: Net Worth Page — Use `data.currency` and `valueInTarget`

**Files:**
- Modify: `app/networth/page.tsx`

- [ ] **Step 1: Replace `valueInUsd` with `valueInTarget` and `"USD"` with `data.currency`**

Update `app/networth/page.tsx`. The changes are:

1. `Row` now receives `currency` prop for formatting
2. All `valueInUsd` references become `valueInTarget`
3. All hardcoded `"USD"` in `formatCurrency` calls become the response `currency`

Replace the full file:

```typescript
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNetWorth,
  NetWorthResponse,
  AssetItem,
  AccountItem,
  LoanItem,
} from "@/lib/api/networth";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/api/accounts";

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate",
  stock: "Stocks",
  bond: "Bonds",
  gold: "Gold",
};

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
  const { data, isLoading, error } = useQuery<NetWorthResponse>({
    queryKey: ["networth"],
    queryFn: getNetWorth,
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
              <AssetsBreakdown data={data.assets} currency={currency} />
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
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit Tasks 5 and 6 together**

```bash
git add lib/api/networth.ts app/networth/page.tsx
git commit -m "feat: use defaultCurrency in net worth client and page"
```

---

## Task 7: Home Page — Use `defaultCurrency` from Settings

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Import `getSettings` and add the settings query**

In `app/page.tsx`, add the import and query:

```typescript
// Add to existing imports:
import { getSettings } from "@/lib/api/settings";
```

Inside the `Home` component, add after the existing queries:

```typescript
const { data: settings } = useQuery({
  queryKey: ["settings"],
  queryFn: getSettings,
});
```

- [ ] **Step 2: Replace the derived `currency` line**

Find and replace:

```typescript
// Use default account's currency or fallback to USD
const defaultAccount = accounts.find(acc => acc.isDefault);
const currency = defaultAccount?.currency ?? accounts[0]?.currency ?? "USD";
```

With:

```typescript
const currency = (settings?.defaultCurrency ?? "USD") as Currency;
```

The `defaultAccount` variable is no longer needed for currency. Remove the `defaultAccount` declaration as well (it was only used for currency derivation — verify it isn't used elsewhere in the component before removing).

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: use defaultCurrency from settings on home page"
```

---

## Task 8: Settings Page — Inline Currency Selector

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Replace the file with the updated version**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, CreditCard, Tag, User, DollarSign, Upload, Landmark } from "lucide-react";
import { ImportDialog } from "@/components/transactions/import-dialog";
import { getSettings, updateSettings } from "@/lib/api/settings";
import { Currency } from "@/lib/api/accounts";

const SETTINGS_ITEMS = [
  { href: "/settings/account", label: "User", description: "Manage password and logout", icon: User },
  { href: "/settings/accounts", label: "Accounts", description: "Manage your bank accounts", icon: CreditCard },
  { href: "/settings/categories", label: "Categories", description: "Manage transaction categories", icon: Tag },
  { href: "/settings/exchange-rates", label: "Currency", description: "Manage exchange rates", icon: DollarSign },
  { href: "/settings/loan-categories", label: "Loan Defaults", description: "Default categories for loan payments", icon: Landmark },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "VND", label: "VND" },
];

export default function SettingsPage() {
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-4 rounded-lg border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Display Currency</p>
          <p className="text-xs text-muted-foreground">Used for summaries and net worth</p>
        </div>
        <select
          value={settings?.defaultCurrency ?? "USD"}
          onChange={e =>
            updateMutation.mutate({ defaultCurrency: e.target.value as Currency })
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {CURRENCY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="divide-y rounded-lg border overflow-hidden">
        {SETTINGS_ITEMS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-4 py-4 hover:bg-accent transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Icon className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
        <button
          onClick={() => setImportOpen(true)}
          className="flex w-full items-center gap-4 px-4 py-4 hover:bg-accent transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Upload className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sm">Import</p>
            <p className="text-xs text-muted-foreground">Import transactions from a file</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint app/settings/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add display currency selector to settings page"
```

---

## Task 9: Update Seed to Clear `UserSettings` on Re-seed

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add `userSettings` cleanup before user deletion**

In `prisma/seed.ts`, add this line before `prisma.user.deleteMany`:

```typescript
await prisma.userSettings.deleteMany({ where: { user: { email: "test@example.com" } } });
```

The full cleanup block becomes:

```typescript
await prisma.budget.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.loanPayment.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.loan.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.transaction.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.transactionCategory.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.account.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.exchangeRate.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.asset.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.userSettings.deleteMany({ where: { user: { email: "test@example.com" } } });
await prisma.user.deleteMany({ where: { email: "test@example.com" } });
```

- [ ] **Step 2: Re-run seed to verify**

```bash
pnpm db:seed
```

Expected: `Seed complete.` with no errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "fix: clear userSettings in seed cleanup"
```

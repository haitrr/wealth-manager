# Assets & Net Worth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add asset tracking (real estate, stocks, bonds, gold) and a net worth page aggregating accounts + assets − loan liabilities.

**Architecture:** A unified `Asset` Prisma model with a `type` enum and a `metadata` JSON column holds all asset types. Live price refresh for stocks (Yahoo Finance) and gold (metals-api) is a dedicated POST endpoint. A `/api/networth` endpoint aggregates accounts, assets, and loan remaining principal with currency conversion using the existing `ExchangeRate` model.

**Tech Stack:** Next.js App Router, Prisma (PostgreSQL), React Query, Axios, shadcn/ui, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `AssetType` enum + `Asset` model |
| Create | `app/api/assets/asset-route-utils.ts` | Shared parsing, validation, ownership check |
| Create | `app/api/assets/route.ts` | GET list, POST create |
| Create | `app/api/assets/[id]/route.ts` | GET, PATCH, DELETE |
| Create | `app/api/assets/[id]/refresh-price/route.ts` | POST — fetch live price |
| Create | `app/api/networth/route.ts` | GET — aggregate net worth |
| Create | `lib/api/assets.ts` | Client-side types + API calls |
| Create | `lib/api/networth.ts` | Client-side types + API call |
| Create | `components/assets/asset-form.tsx` | Create/edit dialog, dynamic fields by type |
| Create | `components/assets/asset-card.tsx` | Asset row with refresh button |
| Create | `app/assets/page.tsx` | CRUD list page |
| Create | `app/networth/page.tsx` | Read-only aggregate view |
| Modify | `components/bottom-nav.tsx` | Add Net Worth + Assets nav items |

---

## Task 1: Prisma Schema — Add Asset Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the AssetType enum and Asset model**

Add this block to `prisma/schema.prisma` after the `ExchangeRate` model:

```prisma
enum AssetType {
  real_estate
  stock
  bond
  gold
}

model Asset {
  id           String    @id @default(cuid())
  name         String
  type         AssetType
  currency     Currency  @default(USD)
  currentValue Float
  quantity     Float?
  ticker       String?
  metadata     Json      @default("{}")
  lastPricedAt DateTime?
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId, type])
}
```

Also add `assets Asset[]` to the `User` model's relation list (after `loans Loan[]`):

```prisma
assets               Asset[]
```

- [ ] **Step 2: Run the migration**

```bash
pnpm prisma migrate dev --name add-assets
```

Expected: migration file created, client regenerated, no errors.

- [ ] **Step 3: Verify types are generated**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Asset model to schema"
```

---

## Task 2: Asset Route Utils

**Files:**
- Create: `app/api/assets/asset-route-utils.ts`

- [ ] **Step 1: Create the file**

```typescript
import { AssetType, Currency, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/db";

const ASSET_TYPES = new Set<AssetType>(["real_estate", "stock", "bond", "gold"]);
const CURRENCIES = new Set<Currency>(["USD", "VND"]);

export interface AssetPayload {
  name: string;
  type: string;
  currency?: string;
  currentValue: number;
  quantity?: number | null;
  ticker?: string | null;
  metadata?: Record<string, unknown>;
}

export function parseAssetPayload(payload: AssetPayload) {
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required");
  if (!ASSET_TYPES.has(payload.type as AssetType)) throw new Error("Invalid asset type");
  const currency = (payload.currency ?? "USD") as Currency;
  if (!CURRENCIES.has(currency)) throw new Error("Invalid currency");
  const currentValue = Number(payload.currentValue);
  if (!Number.isFinite(currentValue) || currentValue < 0) throw new Error("Current value must be a non-negative number");
  if (payload.type === "stock") {
    if (!payload.ticker?.trim()) throw new Error("Ticker is required for stocks");
    if (!payload.quantity || Number(payload.quantity) <= 0) throw new Error("Quantity must be positive for stocks");
  }
  if (payload.type === "gold") {
    if (!payload.quantity || Number(payload.quantity) <= 0) throw new Error("Quantity must be positive for gold");
  }
  return {
    name,
    type: payload.type as AssetType,
    currency,
    currentValue,
    quantity: payload.quantity != null ? Number(payload.quantity) : null,
    ticker: payload.ticker?.trim() || null,
    metadata: payload.metadata ?? {},
  };
}

export async function getOwnedAsset(id: string, userId: string) {
  return prisma.asset.findFirst({ where: { id, userId } });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/assets/asset-route-utils.ts
git commit -m "feat: add asset route utils"
```

---

## Task 3: Assets List & Create API

**Files:**
- Create: `app/api/assets/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { parseAssetPayload, AssetPayload } from "./asset-route-utils";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await prisma.asset.findMany({
    where: { userId: session.userId },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = parseAssetPayload(await req.json() as AssetPayload);
    const asset = await prisma.asset.create({
      data: { ...parsed, userId: session.userId },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create asset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/assets/route.ts
git commit -m "feat: add assets list and create API"
```

---

## Task 4: Asset Detail API (GET, PATCH, DELETE)

**Files:**
- Create: `app/api/assets/[id]/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset, parseAssetPayload, AssetPayload } from "../asset-route-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  return NextResponse.json(asset);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedAsset(id, session.userId);
  if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  try {
    const parsed = parseAssetPayload(await req.json() as AssetPayload);
    const updated = await prisma.asset.update({ where: { id }, data: parsed });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update asset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/assets/[id]/route.ts"
git commit -m "feat: add asset detail API"
```

---

## Task 5: Asset Price Refresh API

**Files:**
- Create: `app/api/assets/[id]/refresh-price/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset } from "../../asset-route-utils";

async function fetchStockPrice(ticker: string): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ticker ${ticker}`);
  const json = await res.json();
  const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!price) throw new Error(`Could not parse price for ticker ${ticker}`);
  return price;
}

async function fetchGoldPriceUsd(): Promise<number> {
  // Open Exchange Rates free endpoint for XAU (gold) per USD
  const res = await fetch("https://open.er-api.com/v6/latest/XAU", { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Gold price fetch returned ${res.status}`);
  const json = await res.json();
  const usdPerOz = json?.rates?.USD;
  if (!usdPerOz) throw new Error("Could not parse gold price");
  return usdPerOz;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  if (asset.type !== "stock" && asset.type !== "gold") {
    return NextResponse.json({ error: "Price refresh is only supported for stocks and gold" }, { status: 400 });
  }

  try {
    let pricePerUnit: number;
    if (asset.type === "stock") {
      if (!asset.ticker) return NextResponse.json({ error: "Asset has no ticker" }, { status: 400 });
      pricePerUnit = await fetchStockPrice(asset.ticker);
    } else {
      pricePerUnit = await fetchGoldPriceUsd();
    }

    const quantity = asset.quantity ?? 1;
    const currentValue = pricePerUnit * quantity;

    const updated = await prisma.asset.update({
      where: { id },
      data: { currentValue, lastPricedAt: new Date() },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/assets/[id]/refresh-price/route.ts"
git commit -m "feat: add asset price refresh API"
```

---

## Task 6: Net Worth API

**Files:**
- Create: `app/api/networth/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { Currency } from "@prisma/client";

function convertToUsd(amount: number, currency: Currency, rates: { fromCurrency: string; toCurrency: string; rate: number }[]): number {
  if (currency === "USD") return amount;
  const direct = rates.find(r => r.fromCurrency === currency && r.toCurrency === "USD");
  if (direct) return amount * direct.rate;
  const inverse = rates.find(r => r.fromCurrency === "USD" && r.toCurrency === currency);
  if (inverse) return amount / inverse.rate;
  return amount; // no rate found — return as-is, flagged in response
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accounts, assets, loans, exchangeRates] = await Promise.all([
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

  const missingRates: string[] = [];

  const accountItems = accounts.map(a => {
    const valueInUsd = convertToUsd(a.balance, a.currency, exchangeRates);
    if (a.currency !== "USD" && valueInUsd === a.balance) missingRates.push(`${a.currency}/USD`);
    return { id: a.id, name: a.name, balance: a.balance, currency: a.currency, valueInUsd };
  });

  const assetItems = assets.map(a => {
    const valueInUsd = convertToUsd(a.currentValue, a.currency, exchangeRates);
    if (a.currency !== "USD" && valueInUsd === a.currentValue) missingRates.push(`${a.currency}/USD`);
    return { ...a, valueInUsd };
  });

  const loanItems = loans.map(loan => {
    const principalAmount = loan.initialTransaction?.amount ?? 0;
    const paidPrincipal = loan.payments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
    const outstandingPrincipal = Math.max(0, principalAmount - paidPrincipal);
    const valueInUsd = convertToUsd(outstandingPrincipal, loan.currency, exchangeRates);
    return { id: loan.id, name: loan.name, direction: loan.direction, outstandingPrincipal, currency: loan.currency, valueInUsd };
  });

  // Only borrowed loans count as liabilities; lent loans are assets (receivables) — omit for simplicity
  const borrowedLoans = loanItems.filter(l => l.direction === "borrowed");

  const liquidTotal = accountItems.reduce((s, a) => s + a.valueInUsd, 0);
  const assetsByType = {
    real_estate: assetItems.filter(a => a.type === "real_estate"),
    stock: assetItems.filter(a => a.type === "stock"),
    bond: assetItems.filter(a => a.type === "bond"),
    gold: assetItems.filter(a => a.type === "gold"),
  } as const;
  const assetsTotal = assetItems.reduce((s, a) => s + a.valueInUsd, 0);
  const liabilitiesTotal = borrowedLoans.reduce((s, l) => s + l.valueInUsd, 0);

  return NextResponse.json({
    totalNetWorth: liquidTotal + assetsTotal - liabilitiesTotal,
    missingRates: [...new Set(missingRates)],
    liquid: { total: liquidTotal, accounts: accountItems },
    assets: {
      total: assetsTotal,
      byType: {
        real_estate: { total: assetsByType.real_estate.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.real_estate },
        stock: { total: assetsByType.stock.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.stock },
        bond: { total: assetsByType.bond.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.bond },
        gold: { total: assetsByType.gold.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.gold },
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
git commit -m "feat: add net worth API"
```

---

## Task 7: API Client Files

**Files:**
- Create: `lib/api/assets.ts`
- Create: `lib/api/networth.ts`

- [ ] **Step 1: Create `lib/api/assets.ts`**

```typescript
import api from "@/lib/axios";
import { Currency } from "./accounts";

export type AssetType = "real_estate" | "stock" | "bond" | "gold";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency: Currency;
  currentValue: number;
  quantity: number | null;
  ticker: string | null;
  metadata: Record<string, unknown>;
  lastPricedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetPayload {
  name: string;
  type: AssetType;
  currency?: Currency;
  currentValue: number;
  quantity?: number | null;
  ticker?: string | null;
  metadata?: Record<string, unknown>;
}

export async function getAssets(): Promise<Asset[]> {
  const { data } = await api.get<Asset[]>("/assets");
  return data;
}

export async function getAsset(id: string): Promise<Asset> {
  const { data } = await api.get<Asset>(`/assets/${id}`);
  return data;
}

export async function createAsset(payload: AssetPayload): Promise<Asset> {
  const { data } = await api.post<Asset>("/assets", payload);
  return data;
}

export async function updateAsset(id: string, payload: AssetPayload): Promise<Asset> {
  const { data } = await api.patch<Asset>(`/assets/${id}`, payload);
  return data;
}

export async function deleteAsset(id: string): Promise<void> {
  await api.delete(`/assets/${id}`);
}

export async function refreshAssetPrice(id: string): Promise<Asset> {
  const { data } = await api.post<Asset>(`/assets/${id}/refresh-price`);
  return data;
}
```

- [ ] **Step 2: Create `lib/api/networth.ts`**

```typescript
import api from "@/lib/axios";
import { Currency } from "./accounts";
import { AssetType } from "./assets";

export interface AccountItem {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
  valueInUsd: number;
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
  valueInUsd: number;
}

export interface LoanItem {
  id: string;
  name: string;
  direction: "borrowed" | "lent";
  outstandingPrincipal: number;
  currency: Currency;
  valueInUsd: number;
}

export interface AssetsByType {
  real_estate: { total: number; items: AssetItem[] };
  stock: { total: number; items: AssetItem[] };
  bond: { total: number; items: AssetItem[] };
  gold: { total: number; items: AssetItem[] };
}

export interface NetWorthResponse {
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

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/api/assets.ts lib/api/networth.ts
git commit -m "feat: add assets and networth API client files"
```

---

## Task 8: Asset Form Component

**Files:**
- Create: `components/assets/asset-form.tsx`

- [ ] **Step 1: Create the file**

```typescript
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Asset, AssetPayload, AssetType } from "@/lib/api/assets";
import { Currency } from "@/lib/api/accounts";

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "stock", label: "Stock" },
  { value: "bond", label: "Bond" },
  { value: "gold", label: "Gold" },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "VND", label: "VND" },
];

function NativeSelect({ id, name, value, options, onChange, required }: {
  id: string; name: string; value: string; required?: boolean;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      required={required}
      onChange={e => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

interface AssetFormProps {
  open: boolean;
  asset?: Asset | null;
  onClose: () => void;
  onSubmit: (payload: AssetPayload) => Promise<void>;
  onDelete?: (asset: Asset) => Promise<void>;
}

export function AssetForm({ open, asset, onClose, onSubmit, onDelete }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [type, setType] = useState<AssetType>(asset?.type ?? "stock");
  const [currency, setCurrency] = useState<Currency>(asset?.currency ?? "USD");

  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    setType(asset?.type ?? "stock");
    setCurrency(asset?.currency ?? "USD");
  }, [open, asset]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";

    const metadata: Record<string, unknown> = {};
    if (type === "real_estate") {
      metadata.address = get("address");
      metadata.purchasePrice = get("purchasePrice") ? Number(get("purchasePrice")) : undefined;
      metadata.purchaseDate = get("purchaseDate") || undefined;
    } else if (type === "stock") {
      metadata.exchange = get("exchange");
    } else if (type === "bond") {
      metadata.issuer = get("issuer");
      metadata.interestRate = get("interestRate") ? Number(get("interestRate")) : undefined;
      metadata.maturityDate = get("maturityDate") || undefined;
    } else if (type === "gold") {
      metadata.form = get("goldForm");
    }

    const payload: AssetPayload = {
      name: get("name"),
      type,
      currency,
      currentValue: Number(get("currentValue")),
      quantity: get("quantity") ? Number(get("quantity")) : null,
      ticker: get("ticker") || null,
      metadata,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const meta = asset?.metadata as Record<string, unknown> | undefined;

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "Add Asset"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Apple shares" defaultValue={asset?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" value={type} onChange={v => setType(v as AssetType)}
                options={ASSET_TYPE_OPTIONS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <NativeSelect id="currency" name="currency" value={currency} onChange={v => setCurrency(v as Currency)}
                options={CURRENCY_OPTIONS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <Input id="currentValue" name="currentValue" type="number" step="any" min="0"
                defaultValue={asset?.currentValue ?? ""} required />
            </div>
            {(type === "stock" || type === "gold") && (
              <div className="space-y-2">
                <Label htmlFor="quantity">{type === "gold" ? "Quantity (oz)" : "Shares"}</Label>
                <Input id="quantity" name="quantity" type="number" step="any" min="0"
                  defaultValue={asset?.quantity ?? ""} required />
              </div>
            )}
          </div>

          {type === "stock" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker</Label>
                <Input id="ticker" name="ticker" placeholder="e.g. AAPL"
                  defaultValue={asset?.ticker ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange</Label>
                <Input id="exchange" name="exchange" placeholder="e.g. NASDAQ"
                  defaultValue={meta?.exchange as string ?? ""} />
              </div>
            </div>
          )}

          {type === "real_estate" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="e.g. 123 Main St"
                  defaultValue={meta?.address as string ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input id="purchasePrice" name="purchasePrice" type="number" step="any" min="0"
                    defaultValue={meta?.purchasePrice as number ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input id="purchaseDate" name="purchaseDate" type="date"
                    defaultValue={meta?.purchaseDate as string ?? ""} />
                </div>
              </div>
            </>
          )}

          {type === "bond" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input id="issuer" name="issuer" placeholder="e.g. US Treasury"
                  defaultValue={meta?.issuer as string ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate" name="interestRate" type="number" step="0.01" min="0"
                    defaultValue={meta?.interestRate as number ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maturityDate">Maturity Date</Label>
                  <Input id="maturityDate" name="maturityDate" type="date"
                    defaultValue={meta?.maturityDate as string ?? ""} />
                </div>
              </div>
            </>
          )}

          {type === "gold" && (
            <div className="space-y-2">
              <Label htmlFor="goldForm">Form</Label>
              <select
                id="goldForm"
                name="goldForm"
                defaultValue={meta?.form as string ?? "physical"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="physical">Physical</option>
                <option value="ETF">ETF</option>
              </select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {asset && onDelete && (
                confirmDelete
                  ? <p className="text-sm text-destructive">Delete this asset?</p>
                  : <Button type="button" variant="outline"
                      className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive"
                      onClick={() => setConfirmDelete(true)} disabled={loading}>
                      <Trash2 className="size-4 mr-1" />Delete
                    </Button>
              )}
            </div>
            <div className="flex gap-2">
              {confirmDelete ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button type="button" variant="destructive" disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try { await onDelete?.(asset!); onClose(); }
                      finally { setLoading(false); }
                    }}>
                    {loading ? "Deleting…" : "Confirm Delete"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Saving…" : asset ? "Save Changes" : "Add Asset"}</Button>
                </>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/assets/asset-form.tsx
git commit -m "feat: add asset form component"
```

---

## Task 9: Asset Card Component

**Files:**
- Create: `components/assets/asset-card.tsx`

- [ ] **Step 1: Create the file**

```typescript
"use client";

import { RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asset } from "@/lib/api/assets";
import { formatCurrency } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate",
  stock: "Stock",
  bond: "Bond",
  gold: "Gold",
};

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onRefreshPrice: (asset: Asset) => void;
  refreshing?: boolean;
}

export function AssetCard({ asset, onEdit, onRefreshPrice, refreshing }: AssetCardProps) {
  const canRefresh = asset.type === "stock" || asset.type === "gold";
  const lastPriced = asset.lastPricedAt
    ? new Date(asset.lastPricedAt).toLocaleDateString()
    : null;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{asset.name}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {TYPE_LABELS[asset.type]}
          </span>
        </div>
        <p className="text-base font-semibold mt-0.5">
          {formatCurrency(asset.currentValue, asset.currency)}
        </p>
        {lastPriced && (
          <p className="text-[10px] text-muted-foreground">Last priced: {lastPriced}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canRefresh && (
          <Button size="icon" variant="ghost" className="size-8" onClick={() => onRefreshPrice(asset)} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(asset)}>
          <Pencil className="size-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/assets/asset-card.tsx
git commit -m "feat: add asset card component"
```

---

## Task 10: Assets Page

**Files:**
- Create: `app/assets/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetCard } from "@/components/assets/asset-card";
import { createAsset, deleteAsset, getAssets, refreshAssetPrice, updateAsset, Asset, AssetType } from "@/lib/api/assets";
import { formatCurrency } from "@/lib/utils";

const TYPE_ORDER: AssetType[] = ["real_estate", "stock", "bond", "gold"];
const TYPE_LABELS: Record<AssetType, string> = {
  real_estate: "Real Estate",
  stock: "Stocks",
  bond: "Bonds",
  gold: "Gold",
};

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["assets"] });

  const createMutation = useMutation({ mutationFn: createAsset, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...p }: { id: string } & Parameters<typeof updateAsset>[1]) => updateAsset(id, p),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteAsset, onSuccess: invalidate });

  async function handleRefreshPrice(asset: Asset) {
    setRefreshingId(asset.id);
    try {
      await refreshAssetPrice(asset.id);
      invalidate();
    } finally {
      setRefreshingId(null);
    }
  }

  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  const byType = TYPE_ORDER.reduce((acc, t) => {
    acc[t] = assets.filter(a => a.type === t);
    return acc;
  }, {} as Record<AssetType, Asset[]>);

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Assets</h1>
          {assets.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(totalValue, "USD")}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => { setEditingAsset(null); setFormOpen(true); }}>
          <Plus className="size-4 mr-1" />Add Asset
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && error && <p className="text-sm text-destructive">Unable to load assets.</p>}

      {!isLoading && !error && assets.length === 0 && (
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-sm font-medium">No assets yet</p>
          <p className="text-sm text-muted-foreground">Add real estate, stocks, bonds, or gold to track your wealth.</p>
        </div>
      )}

      {!isLoading && !error && assets.length > 0 && (
        <div className="space-y-6">
          {TYPE_ORDER.map(type => {
            const items = byType[type];
            if (items.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {TYPE_LABELS[type]}
                </h2>
                <div className="space-y-2">
                  {items.map(asset => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onEdit={a => { setEditingAsset(a); setFormOpen(true); }}
                      onRefreshPrice={handleRefreshPrice}
                      refreshing={refreshingId === asset.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssetForm
        open={formOpen}
        asset={editingAsset}
        onClose={() => { setFormOpen(false); setEditingAsset(null); }}
        onSubmit={async payload => {
          if (editingAsset) {
            await updateMutation.mutateAsync({ id: editingAsset.id, ...payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
        onDelete={async asset => { await deleteMutation.mutateAsync(asset.id); }}
      />
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/assets/page.tsx
git commit -m "feat: add assets page"
```

---

## Task 11: Net Worth Page

**Files:**
- Create: `app/networth/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getNetWorth, NetWorthResponse, AssetItem, AccountItem, LoanItem } from "@/lib/api/networth";
import { formatCurrency } from "@/lib/utils";

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate",
  stock: "Stocks",
  bond: "Bonds",
  gold: "Gold",
};

function SectionCard({ title, total, children, href }: {
  title: string; total: number; children: React.ReactNode; href?: string;
}) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatCurrency(total, "USD")}</span>
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

function Row({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div>
        <p className="text-sm">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <p className="text-sm font-medium">{formatCurrency(value, "USD")}</p>
    </div>
  );
}

function AssetsBreakdown({ data }: { data: NetWorthResponse["assets"] }) {
  return (
    <>
      {(Object.entries(data.byType) as [string, { total: number; items: AssetItem[] }][])
        .filter(([, v]) => v.items.length > 0)
        .map(([type, group]) => (
          <div key={type}>
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">{ASSET_TYPE_LABELS[type]}</p>
              <p className="text-xs font-medium text-muted-foreground">{formatCurrency(group.total, "USD")}</p>
            </div>
            {group.items.map(item => (
              <Row key={item.id} label={item.name} value={item.valueInUsd}
                sub={item.ticker ? `${item.ticker} · ${item.currentValue} @ qty ${item.quantity}` : undefined} />
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

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-semibold mb-6">Net Worth</h1>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && error && <p className="text-sm text-destructive">Unable to load net worth.</p>}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4 px-4">
              <p className="text-xs text-muted-foreground">Total Net Worth</p>
              <p className={`text-3xl font-bold tracking-tight mt-1 ${data.totalNetWorth >= 0 ? "" : "text-destructive"}`}>
                {formatCurrency(data.totalNetWorth, "USD")}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Liquid</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.liquid.total, "USD")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Assets</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(data.assets.total, "USD")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Liabilities</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.liabilities.total, "USD")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.missingRates.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <span>Missing exchange rates for: {data.missingRates.join(", ")}. Some values shown unconverted.</span>
            </div>
          )}

          <SectionCard title="Liquid" total={data.liquid.total} href="/settings/accounts">
            {data.liquid.accounts.map((a: AccountItem) => (
              <Row key={a.id} label={a.name} value={a.valueInUsd}
                sub={a.currency !== "USD" ? `${formatCurrency(a.balance, a.currency)}` : undefined} />
            ))}
          </SectionCard>

          {data.assets.total > 0 && (
            <SectionCard title="Assets" total={data.assets.total} href="/assets">
              <AssetsBreakdown data={data.assets} />
            </SectionCard>
          )}

          {data.liabilities.total > 0 && (
            <SectionCard title="Liabilities" total={data.liabilities.total} href="/loans">
              {data.liabilities.loans.map((l: LoanItem) => (
                <Row key={l.id} label={l.name} value={l.valueInUsd}
                  sub={l.currency !== "USD" ? `${formatCurrency(l.outstandingPrincipal, l.currency)} outstanding` : "outstanding"} />
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

- [ ] **Step 3: Commit**

```bash
git add app/networth/page.tsx
git commit -m "feat: add net worth page"
```

---

## Task 12: Bottom Nav Update

**Files:**
- Modify: `components/bottom-nav.tsx`

> **Note:** This adds Net Worth and Assets to the nav for a total of 7 items. If the nav feels too crowded, consider removing Loans (accessible via Settings) in a follow-up.

- [ ] **Step 1: Update the nav items**

Replace the `NAV_ITEMS` array and imports in `components/bottom-nav.tsx`:

```typescript
import { Building2, HandCoins, Home, List, PiggyBank, Settings, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/networth", label: "Net Worth", icon: TrendingUp },
  { href: "/assets", label: "Assets", icon: Building2 },
  { href: "/loans", label: "Loans", icon: HandCoins },
  { href: "/settings", label: "Settings", icon: Settings },
];
```

- [ ] **Step 2: Type-check and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint components/bottom-nav.tsx
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify navigation**

```bash
pnpm dev
```

Open http://localhost:3000, verify:
- Net Worth and Assets appear in the bottom nav
- Navigating to `/networth` shows the net worth page
- Navigating to `/assets` shows the assets list
- Add an asset, verify it appears in the list and in the net worth page
- Refresh price on a stock (e.g. ticker "AAPL") and verify currentValue updates

- [ ] **Step 4: Commit**

```bash
git add components/bottom-nav.tsx
git commit -m "feat: add net worth and assets to bottom nav"
```

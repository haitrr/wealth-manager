# Default Display Currency — Design Spec

**Date:** 2026-05-11

## Overview

Allow users to set a preferred display currency. All monetary summaries (home dashboard total balance, net worth page) convert values to this currency instead of inferring it from the default account or hardcoding USD.

---

## Approach

Server-side conversion. The `/api/networth` endpoint reads `UserSettings.defaultCurrency` and converts all values before responding. The home page reads the setting client-side (already fetches exchange rates) and uses it as the conversion target. No conversion logic is duplicated — each consumer reads `settings.defaultCurrency` and applies the existing exchange rate logic.

---

## Data Model

Add `defaultCurrency` to `UserSettings`:

```prisma
model UserSettings {
  ...existing fields...
  defaultCurrency  Currency  @default(USD)
}
```

Migration: `pnpm prisma migrate dev --name add-default-currency`.

---

## Settings API (`/api/settings`)

Add `"defaultCurrency"` to the `allowed` array in `PUT /api/settings/route.ts`. Values are validated by Prisma against the `Currency` enum (USD, VND).

Update `lib/api/settings.ts`:
- Add `defaultCurrency: Currency` to the `UserSettings` interface
- Add `defaultCurrency` to `UserSettingsPayload`

---

## Net Worth API (`/api/networth`)

**Changes:**
- Fetch `UserSettings` (via `upsert` to guarantee a row) alongside accounts/assets/loans/rates
- Rename internal helper `convertToUsd` → `convertToCurrency(amount, fromCurrency, toCurrency, rates)`
- Use `settings.defaultCurrency` as the conversion target throughout
- Add `currency` to the response:

```ts
{
  currency: "VND",        // the target currency used for all totals
  totalNetWorth: number,
  missingRates: string[],
  liquid: { total: number, accounts: AccountItem[] },
  assets: { total: number, byType: AssetsByType },
  liabilities: { total: number, loans: LoanItem[] }
}
```

**Missing rate detection:** if a currency can't be converted to the target, its value is returned unconverted and its pair (e.g. `"VND/USD"` when converting VND to a USD target) is added to `missingRates`.

---

## Net Worth Client Types (`lib/api/networth.ts`)

Add `currency: Currency` to `NetWorthResponse`.

---

## Home Page (`app/page.tsx`)

**Current logic:**
```ts
const currency = defaultAccount?.currency ?? accounts[0]?.currency ?? "USD"
```

**New logic:**
```ts
const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
const currency = (settings?.defaultCurrency ?? "USD") as Currency;
```

The exchange rate conversion loop that computes `totalBalance` already handles any source currency → target currency, so no changes needed there beyond swapping `currency`.

---

## Settings UI (`app/settings/page.tsx`)

Add an inline "Display Currency" control at the top of the settings page (above the menu list). It shows the current value and a dropdown to change it. On change, calls `PUT /api/settings` and invalidates `["settings"]` and `["networth"]` queries.

```
┌─────────────────────────────────┐
│ Display Currency                │
│ [USD ▾]                         │
└─────────────────────────────────┘
[settings menu items below]
```

This is a single inline component on the settings page — no new route needed.

---

## Out of Scope

- Per-account currency override
- Currencies beyond USD and VND
- Automatic exchange rate refresh

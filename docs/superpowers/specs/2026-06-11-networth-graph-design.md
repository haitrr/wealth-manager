# Net Worth Graph Design

**Date:** 2026-06-11

## Overview

Add a historical net worth graph to the `/networth` page. Each asset gains a manual value history log. The graph API computes net worth at each recorded date by combining account balances (from transactions), asset values (from history entries, step-interpolated), and loan outstanding principals (from payment records).

## Database & Data Model

New Prisma model `AssetValueHistory`:

```prisma
model AssetValueHistory {
  id        String   @id @default(cuid())
  assetId   String
  asset     Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  date      DateTime
  value     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([assetId, date])
  @@index([assetId, date])
}
```

- `Asset` gets a `valueHistory AssetValueHistory[]` relation.
- `@@unique([assetId, date])` enforces one entry per asset per day (upsert semantics on write).
- `Asset.currentValue` is not replaced — it continues to drive the real-time net worth snapshot. When a user adds a history entry dated today or the entry becomes the most recent, `currentValue` is updated to match.

## Asset UI — Value History Management

Each asset on `/assets` gets a "History" button that opens a side sheet containing:

1. A list of past value entries (date + value), newest first, each with a delete button.
2. An inline "Add entry" form at the top (date picker + value input + submit).

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/assets/[id]/history` | List all history entries for an asset |
| `POST` | `/api/assets/[id]/history` | Add an entry `{ date, value }` |
| `DELETE` | `/api/assets/[id]/history/[entryId]` | Remove a single entry |

POST upserts by `(assetId, date)`. After any write/delete, if the affected entry is the most recent one, sync `Asset.currentValue` to the new latest value.

## Net Worth Graph API

**Endpoint:** `GET /api/networth/history?range=all|1y|6m|3m|1m`

### Computation

1. Load for the user: all transactions (date, amount, category type, accountId), all asset value history entries, all active loans with their initial transaction and payment transactions.
2. Collect all unique dates from transaction dates + asset history dates.
3. Filter dates to the requested range window.
4. For each date, compute:
   - **Liquid**: per account, sum income transactions − expense transactions with `date ≤ point date`. Sum across all accounts, converted to target currency at current exchange rates.
   - **Assets**: per asset, find the latest history entry with `date ≤ point date` (step interpolation). If no entry exists before the point, the asset contributes 0. Sum across all assets, converted to target currency.
   - **Liabilities**: per active loan, `outstanding = initialAmount − sum of principal payment amounts with paymentDate ≤ point date`. Sum across borrowed loans, converted to target currency.
   - **Total**: `liquid + assets − liabilities`
5. Return sorted array: `{ date: string, total: number, liquid: number, assets: number, liabilities: number }[]`

Exchange rates use current rates (historical FX not tracked).

## Net Worth Graph UI

### Component

`components/networth/net-worth-chart.tsx` — a `NetWorthChart` component that:
- Accepts `data: HistoryPoint[]` and `currency: Currency`
- Renders an `AreaChart` (recharts via shadcn `ChartContainer`) for `total`
- Tooltip shows total + breakdown (liquid, assets, liabilities) on hover
- Shows a zero reference line if any value is negative
- Empty state (< 2 data points): "Add asset value history entries to see your net worth over time."

### Page Integration

On `/networth` page, above the breakdown cards:
1. A time-range selector: `All | 1Y | 6M | 3M | 1M` (default: All) — reuses or mirrors `TimeRangeSelector` pattern from transactions page.
2. The `NetWorthChart` component, fed by `useQuery` on `/api/networth/history?range=<selected>`.

### New files

- `components/networth/net-worth-chart.tsx` — chart component
- `lib/api/networth-history.ts` — API client function + types

## Out of Scope

- Automatic price fetching for stock tickers
- Historical exchange rates
- Editing existing history entries (delete + re-add)

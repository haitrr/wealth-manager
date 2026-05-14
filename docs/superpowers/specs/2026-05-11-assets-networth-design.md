# Assets & Net Worth — Design Spec

**Date:** 2026-05-11

## Overview

Add asset tracking (real estate, stocks, bonds, gold) and a net worth page that aggregates all accounts, assets, and loan liabilities into a single view.

---

## Data Model

### New Prisma enum and model

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
  quantity     Float?    // shares, oz, units — null for real estate
  ticker       String?   // stocks only, used for live price fetch
  metadata     Json      @default("{}")
  lastPricedAt DateTime?
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId, type])
}
```

`User` model gets a new `assets Asset[]` relation.

### `metadata` shape by asset type

| Type | Fields |
|------|--------|
| `real_estate` | `{ address: string, purchasePrice: number, purchaseDate: string }` |
| `stock` | `{ exchange: string }` — ticker is a top-level column |
| `bond` | `{ issuer: string, interestRate: number, maturityDate: string }` |
| `gold` | `{ form: string }` — e.g. "physical", "ETF" |

### Price sources (free, no API key required)

- **Stocks:** Yahoo Finance unofficial API — `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}`
- **Gold:** Open exchange rates or metals-api.com free tier for XAU/USD spot price

`currentValue` stores the final dollar value (price × quantity for stocks/gold). `lastPricedAt` records when it was last refreshed.

---

## Pages

### `/assets` page

CRUD page for managing assets. Listed per-user, grouped or flat list. Each row shows:
- Name, type badge, current value, currency, last priced time
- Edit / delete actions
- "Refresh price" button for stocks and gold (triggers live fetch)

Asset form fields vary by type:
- All types: name, currency, current value (manual override)
- Stock: ticker, quantity, exchange
- Gold: quantity, form (physical/ETF)
- Bond: issuer, interest rate, maturity date
- Real estate: address, purchase price, purchase date

### `/networth` page

Read-only aggregate view. Added to bottom nav.

**Summary card:**
- Total net worth = Σ account balances + Σ asset values − Σ outstanding loan principal
- All values converted to default currency (USD) using existing `ExchangeRate` model

**Breakdown sections:**
1. **Liquid** — account balances, link to `/settings/accounts`
2. **Assets** — grouped by type with subtotals, link to `/assets`
3. **Liabilities** — outstanding loan balances, link to `/loans`

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assets` | List all assets for current user |
| POST | `/api/assets` | Create asset |
| GET | `/api/assets/[id]` | Get single asset |
| PATCH | `/api/assets/[id]` | Update asset |
| DELETE | `/api/assets/[id]` | Delete asset |
| POST | `/api/assets/[id]/refresh-price` | Fetch live price, update `currentValue` and `lastPricedAt` |
| GET | `/api/networth` | Aggregate accounts + assets − loans with currency conversion |

### `/api/networth` response shape

```ts
{
  totalNetWorth: number,        // in USD
  liquid: {
    total: number,
    accounts: { id, name, balance, currency, balanceInUsd }[]
  },
  assets: {
    total: number,
    byType: {
      real_estate: { total: number, items: Asset[] },
      stock:       { total: number, items: Asset[] },
      bond:        { total: number, items: Asset[] },
      gold:        { total: number, items: Asset[] },
    }
  },
  liabilities: {
    total: number,
    loans: { id, name, outstandingPrincipal: number, currency, valueInUsd: number }[]
  }
}
```

---

## Error Handling

- Live price fetch failure: return 502 with message; `currentValue` and `lastPricedAt` unchanged
- Missing exchange rate for currency conversion: skip conversion and flag in response (do not silently zero-out)
- Invalid ticker on stock creation: validated at create/update time via a test fetch

---

## Out of Scope

- Push notifications for price changes
- Historical asset value tracking (charts over time)
- Automated scheduled price refresh (can be added later)

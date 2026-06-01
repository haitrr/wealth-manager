# Budget Period Navigation — Design Spec

**Date:** 2026-06-01

## Overview

Allow users to view budget results for any past period on the budget detail page, using URL-based navigation with prev/next arrow buttons flanking the period label.

## URL Shape

| Budget period | Param format | Example |
|---|---|---|
| Monthly | `?date=YYYY-MM` | `?date=2026-04` |
| Yearly | `?date=YYYY` | `?date=2026` |
| Custom | no navigation | — |

Absence of the param means "current period" — existing behaviour is unchanged.

## API Changes

Both budget detail endpoints accept an optional `date` query param:

### `GET /api/budgets/[id]?date=2026-04`

- Parse `date` param into a `viewDate: Date` (mid-period: day 15 for monthly, July 1 for yearly)
- Pass `viewDate` to `getBudgetWithProgress` instead of `new Date()`
- No schema changes required

### `GET /api/budgets/[id]/transactions?date=2026-04`

- Parse `date` param the same way
- Pass `viewDate` to `getPeriodBounds` instead of `new Date()`

### Date parsing helper

Add `parsePeriodParam(date: string, period: string): Date` in `lib/dates.ts`:
- `"2026-04"` (monthly) → `new Date(2026, 3, 15)` (mid-month, so `getPeriodBounds` returns April bounds)
- `"2026"` (yearly) → `new Date(2026, 6, 1)` (mid-year)
- Invalid/missing → `null` (caller falls back to `new Date()`)

## Frontend Changes

### State & routing

- Read `date` from `useSearchParams()`
- Pass `date` as a query param to both `useQuery` calls (budget detail + transactions)
- Prev/Next buttons call `router.push` with the updated `date` param

### Navigation logic (client-side)

```
currentViewDate = date param ? parse(date) : now
prevDate = subtract one period from currentViewDate
nextDate = add one period from currentViewDate
isCurrentPeriod = nextDate > now  →  disable Next button
```

Period arithmetic:
- Monthly: `subMonths` / `addMonths` from `date-fns`
- Yearly: `subYears` / `addYears`
- Custom: no buttons rendered

### UI

The existing period label row becomes:

```
← May 2026 →        (past period — buttons visible)
← Jun 2026           (current period — Next disabled)
```

- Arrows are `<button>` elements with chevron icons (lucide `ChevronLeft` / `ChevronRight`)
- Next arrow is disabled (muted, non-clickable) when already on the current period
- A small `"Past period"` badge in muted text appears below the date when viewing history
- Custom budgets: no arrows, label unchanged

### No changes needed to

- `BudgetBurnDownChart` — already accepts `periodStart`, `periodEnd`, `transactions`, `currentDate` as props
- `BudgetCategoryPieChart` — already accepts transactions as props
- Transaction list — already renders from fetched transactions

## Out of Scope

- Future period navigation (Next disabled at current period)
- Custom budget period navigation (fixed date range)
- Budget list page period navigation

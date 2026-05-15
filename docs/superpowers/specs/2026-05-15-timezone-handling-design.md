# Timezone Handling Design

**Date:** 2026-05-15  
**Status:** Approved

## Goal

Every date/datetime in a user request is interpreted in the user's configured timezone, not UTC. The backend stores UTC (unchanged) but never blindly calls `new Date(bareString)` — it always applies the user's timezone when no offset is present in the value. Clients (browser + CLI) send timezone-aware ISO strings when possible; the user's configured timezone is the server-side fallback.

## Problem

Currently:
- HTML `<input type="date">` returns `YYYY-MM-DD` — sent bare to the API
- `new Date("2026-05-15")` in JS/Node parses as `2026-05-15T00:00:00.000Z` (UTC midnight)
- A user in UTC+7 entering "May 15" gets UTC midnight stored, meaning their transaction is tagged to May 14 local time in queries
- The frontend mixes bare strings and full ISO depending on which component — inconsistent

## Approach: Hybrid (clients send timezone-aware, backend falls back to user setting)

1. Clients always convert bare dates to full ISO using the local/browser timezone before sending
2. Backend parses any incoming date through a utility that detects bare strings and applies the user's configured timezone as a fallback
3. User stores their timezone preference in `UserSettings`

---

## Section 1: User Timezone Setting

### Schema change

Add `timezone` to `UserSettings` (not `User` — consistent with existing preference pattern):

```prisma
model UserSettings {
  // ... existing fields ...
  timezone  String  @default("UTC")
}
```

IANA timezone string (e.g. `"Asia/Ho_Chi_Minh"`, `"America/New_York"`).

### Migration

`prisma migrate dev --name add-timezone-to-user-settings`

### Settings API

Add `"timezone"` to the `allowed` array in `app/api/settings/route.ts` PUT handler. No other changes needed — the existing upsert pattern handles it.

### Session

Update `getSession` in `app/lib/auth.ts` to also fetch `settings.timezone` from `UserSettings` and include it in the returned session object:

```typescript
return { userId: user.id, email: user.email, timezone: user.settings?.timezone ?? "UTC" };
```

Both the cookie path and the API key path need this change.

### Settings UI

Add a timezone `<select>` to the existing settings page. Options from `Intl.supportedValuesOf("timeZone")`. Pre-fill with `Intl.DateTimeFormat().resolvedOptions().timeZone` on first load (if user hasn't saved one). Save via existing `PUT /api/settings`.

---

## Section 2: Shared Date Utility (`lib/dates.ts`)

Install `date-fns-tz` (works in both Node and browser).

```typescript
import { fromZonedTime } from "date-fns-tz";

// Server: parse an incoming date string using the user's timezone as fallback.
// Strings that already carry timezone info (ends with Z or offset) are passed through as-is.
export function parseDateParam(value: string, timezone: string): Date {
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value.trim());
  if (hasTz) return new Date(value);
  return fromZonedTime(value, timezone);
}

// Client/CLI: convert a YYYY-MM-DD from an HTML date input to start-of-day ISO
// in the browser/machine's local timezone.
export function localStartOfDay(dateStr: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(`${dateStr}T00:00:00`, tz).toISOString();
}

// Client/CLI: convert a YYYY-MM-DD to end-of-day ISO in local timezone.
export function localEndOfDay(dateStr: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(`${dateStr}T23:59:59.999`, tz).toISOString();
}

// Alias — a bare date with no time context means start of that day.
export const localDayToISO = localStartOfDay;
```

`parseDateParam` is server-only (needs session timezone). The `local*` functions are client/CLI (use `Intl`).

---

## Section 3: Backend — Apply `parseDateParam` to All Date-Receiving Routes

Replace every `new Date(dateString)` that comes from user input with `parseDateParam(dateString, session.timezone)`.

Affected routes:

| Route | Field(s) |
|-------|----------|
| `POST /api/transactions` | `date` |
| `GET /api/transactions` | `startDate`, `endDate` query params |
| `GET /api/transactions/summary` | `startDate`, `endDate` query params |
| `POST /api/loans` (via `loan-route-utils.ts`) | `startDate` |
| `POST /api/loans/[id]/payments` (via `loan-route-utils.ts`) | `paymentDate` |
| `POST /api/budgets` | `startDate`, `endDate` |

The loan utilities (`loan-route-utils.ts`) need the user's timezone passed in — update `parseLoanPayload` and `parseLoanPaymentPayload` to accept `timezone: string` as a second argument.

---

## Section 4: Frontend — Send Timezone-Aware Dates

Replace bare `YYYY-MM-DD` extractions with `localDayToISO` / `localStartOfDay` / `localEndOfDay` before the API call.

Affected files:

| File | Field(s) | Fix |
|------|----------|-----|
| `components/transactions/transaction-form.tsx` | `date` | `localDayToISO(inputValue)` |
| `components/loans/loan-form.tsx` | `startDate` | `localDayToISO(inputValue)` |
| `components/loans/loan-payment-form.tsx` | `paymentDate` | `localDayToISO(inputValue)` |
| `components/budgets/budget-form.tsx` | `startDate`, `endDate` | `localDayToISO(inputValue)` |
| `components/transactions/time-range-selector.tsx` | custom `startDate`, `endDate` | `localStartOfDay` / `localEndOfDay` |
| `app/page.tsx` (dashboard) | date range params | `localStartOfDay` / `localEndOfDay` |

Predefined ranges in `time-range-selector.tsx` already use `new Date(year, month, day)` + `.toISOString()` — those correctly produce UTC ISO of local midnight and need no change.

---

## Section 5: CLI — Send Timezone-Aware Dates

| Location | Field | Current | Fix |
|----------|-------|---------|-----|
| `cli/index.ts` `add` command | `--date` | `new Date(flag("date")!).toISOString()` (UTC) | `localDayToISO(flag("date")!)` from `lib/dates.ts` |
| `cli/index.ts` `transactions` | `--from`, `--to` | `date-fns` `startOfDay`/`endOfDay` (already correct — produces UTC of local bounds) | No change needed |
| `cli/index.ts` `summary` | `--year`, `--month` | `new Date(year, month-1, 1)` (local) — already correct | No change needed |

The CLI imports from `../../lib/dates.js` (relative path from `cli/`).

---

## Files to Create or Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `timezone String @default("UTC")` to `UserSettings` |
| `prisma/migrations/...` | Generated migration |
| `lib/dates.ts` | New — shared date utilities |
| `app/lib/auth.ts` | Include `timezone` in session from `UserSettings` |
| `app/api/settings/route.ts` | Add `"timezone"` to allowed fields |
| `app/api/transactions/route.ts` | Use `parseDateParam` |
| `app/api/transactions/summary/route.ts` | Use `parseDateParam` |
| `app/api/loans/loan-route-utils.ts` | Accept `timezone` param, use `parseDateParam` |
| `app/api/loans/route.ts` | Pass `session.timezone` to loan utils |
| `app/api/loans/[id]/payments/route.ts` | Pass `session.timezone` to payment utils |
| `app/api/budgets/route.ts` | Use `parseDateParam` |
| `components/transactions/transaction-form.tsx` | Use `localDayToISO` |
| `components/loans/loan-form.tsx` | Use `localDayToISO` |
| `components/loans/loan-payment-form.tsx` | Use `localDayToISO` |
| `components/budgets/budget-form.tsx` | Use `localDayToISO` |
| `components/transactions/time-range-selector.tsx` | Use `localStartOfDay`/`localEndOfDay` for custom range |
| `app/page.tsx` | Use `localStartOfDay`/`localEndOfDay` for date range |
| `app/(app)/settings/page.tsx` (or similar) | Add timezone selector UI |
| `cli/index.ts` | Use `localDayToISO` for `--date` flag |

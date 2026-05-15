# Timezone Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every date/datetime in the app is interpreted in the user's configured timezone — clients send timezone-aware ISO strings, backend falls back to the user's saved timezone for bare date strings.

**Architecture:** A shared `lib/dates.ts` provides `parseDateParam` (server) and `localStartOfDay`/`localEndOfDay`/`localDayToISO` (client/CLI). User timezone is stored in `UserSettings`, surfaced in `getSession`, and applied in all API routes that receive dates. Frontend forms and the CLI convert bare date inputs to full ISO before sending.

**Tech Stack:** `date-fns-tz` (already has `date-fns` installed), Prisma, Next.js API routes, vitest

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `lib/dates.ts` | Create | Shared date utilities (`parseDateParam`, `localStartOfDay`, `localEndOfDay`, `localDayToISO`) |
| `lib/dates.test.ts` | Create | Vitest unit tests for `parseDateParam` |
| `vitest.config.ts` | Modify | Add `lib/**/*.test.ts` to include |
| `prisma/schema.prisma` | Modify | Add `timezone String @default("UTC")` to `UserSettings` |
| `app/lib/auth.ts` | Modify | `getSession` fetches and returns `timezone` from `UserSettings` |
| `app/api/settings/route.ts` | Modify | Add `"timezone"` to allowed fields |
| `app/settings/page.tsx` | Modify | Add timezone selector UI block |
| `app/api/transactions/route.ts` | Modify | Replace `new Date(dateStr)` with `parseDateParam` |
| `app/api/transactions/summary/route.ts` | Modify | Replace `new Date(startParam/endParam)` with `parseDateParam` |
| `app/api/budgets/route.ts` | Modify | Replace `new Date(startDate/endDate)` with `parseDateParam` |
| `app/api/loans/loan-route-utils.ts` | Modify | Accept `timezone` param, use `parseDateParam` |
| `app/api/loans/route.ts` | Modify | Pass `session.timezone` to loan utils |
| `app/api/loans/[id]/payments/route.ts` | Modify | Pass `session.timezone` to payment utils |
| `components/transactions/transaction-form.tsx` | Modify | Use `localDayToISO` for date field |
| `components/loans/loan-form.tsx` | Modify | Use `localDayToISO` for startDate field |
| `components/loans/loan-payment-form.tsx` | Modify | Use `localDayToISO` for paymentDate field |
| `components/budgets/budget-form.tsx` | Modify | Use `localDayToISO` for startDate/endDate fields |
| `components/transactions/time-range-selector.tsx` | Modify | Use `localStartOfDay`/`localEndOfDay` for custom range |
| `app/page.tsx` | Modify | Use `localStartOfDay`/`localEndOfDay` for date range params |
| `cli/index.ts` | Modify | Use `localDayToISO` for `--date` flag in `add` command |

---

### Task 1: Install `date-fns-tz` and create `lib/dates.ts`

**Files:**
- Create: `lib/dates.ts`
- Create: `lib/dates.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Install `date-fns-tz`**

```bash
pnpm add date-fns-tz
```

Expected: `date-fns-tz` appears in `package.json` dependencies.

- [ ] **Step 2: Write failing tests for `parseDateParam`**

Create `lib/dates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseDateParam } from "./dates.js";

describe("parseDateParam", () => {
  it("passes through a UTC ISO string unchanged", () => {
    const input = "2026-05-15T00:00:00.000Z";
    expect(parseDateParam(input, "Asia/Ho_Chi_Minh").toISOString()).toBe(input);
  });

  it("passes through a positive-offset ISO string unchanged", () => {
    const input = "2026-05-15T07:00:00+07:00";
    expect(parseDateParam(input, "UTC").toISOString()).toBe(new Date(input).toISOString());
  });

  it("passes through a negative-offset ISO string unchanged", () => {
    const input = "2026-05-15T20:00:00-05:00";
    expect(parseDateParam(input, "UTC").toISOString()).toBe(new Date(input).toISOString());
  });

  it("interprets a bare date in the given timezone — UTC+7", () => {
    // midnight May 15 in Ho Chi Minh = 2026-05-14T17:00:00.000Z
    const result = parseDateParam("2026-05-15", "Asia/Ho_Chi_Minh");
    expect(result.toISOString()).toBe("2026-05-14T17:00:00.000Z");
  });

  it("interprets a bare date in UTC when timezone is UTC", () => {
    const result = parseDateParam("2026-05-15", "UTC");
    expect(result.toISOString()).toBe("2026-05-15T00:00:00.000Z");
  });

  it("interprets a bare datetime string in the given timezone", () => {
    // 08:30 in Ho Chi Minh (UTC+7) = 01:30 UTC
    const result = parseDateParam("2026-05-15T08:30:00", "Asia/Ho_Chi_Minh");
    expect(result.toISOString()).toBe("2026-05-15T01:30:00.000Z");
  });

  it("interprets a bare date in a negative-offset timezone — EST (UTC-5)", () => {
    // midnight May 15 in New York = 2026-05-15T05:00:00.000Z
    const result = parseDateParam("2026-05-15", "America/New_York");
    expect(result.toISOString()).toBe("2026-05-15T04:00:00.000Z");
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
./node_modules/.bin/vitest run lib/dates.test.ts
```

Expected: FAIL — `lib/dates.ts` does not exist yet.

- [ ] **Step 4: Create `lib/dates.ts`**

```typescript
import { fromZonedTime } from "date-fns-tz";

// Server: parse an incoming date string using the user's timezone as fallback.
// Strings that already carry timezone info (ends with Z or ±HH:MM) are passed through as-is.
export function parseDateParam(value: string, timezone: string): Date {
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value.trim());
  if (hasTz) return new Date(value);
  return fromZonedTime(value, timezone);
}

// Client/CLI: convert a YYYY-MM-DD from an HTML date input to start-of-day ISO
// in the browser or machine's local timezone.
export function localStartOfDay(dateStr: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(`${dateStr}T00:00:00`, tz).toISOString();
}

// Client/CLI: convert a YYYY-MM-DD to end-of-day ISO in local timezone.
export function localEndOfDay(dateStr: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(`${dateStr}T23:59:59.999`, tz).toISOString();
}

// A bare date with no time context means start of that day.
export const localDayToISO = localStartOfDay;
```

- [ ] **Step 5: Update `vitest.config.ts` to pick up `lib/` tests**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["cli/**/*.test.ts", "lib/**/*.test.ts"],
    clearMocks: true,
  },
});
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
./node_modules/.bin/vitest run lib/dates.test.ts
```

Expected: all 7 tests pass.

Note: the `America/New_York` test expects `2026-05-15T04:00:00.000Z` — New York observes EDT (UTC-4) in May, not EST (UTC-5). If the test fails with `05:00:00`, change the expected value to `2026-05-15T05:00:00.000Z` and update the comment to `UTC-5 in winter / UTC-4 in summer`.

- [ ] **Step 7: Run ESLint**

```bash
pnpm exec eslint lib/dates.ts lib/dates.test.ts
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/dates.ts lib/dates.test.ts vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add shared date utilities with timezone-aware parsing"
```

---

### Task 2: Add `timezone` to `UserSettings` schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `timezone` field to `UserSettings`**

In `prisma/schema.prisma`, find the `UserSettings` model and add the field after `defaultCurrency`:

```prisma
  defaultCurrency                 Currency @default(USD)
  timezone                        String   @default("UTC")
```

- [ ] **Step 2: Run migration**

```bash
pnpm exec prisma migrate dev --name add_timezone_to_user_settings
```

Expected: migration file created in `prisma/migrations/`, Prisma client regenerated.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add timezone field to UserSettings"
```

---

### Task 3: Surface `timezone` in `getSession`

**Files:**
- Modify: `app/lib/auth.ts`

- [ ] **Step 1: Update the API key auth path in `getSession`**

Replace:
```typescript
      const user = await prisma.user.findUnique({
        where: { id: apiKey.userId },
        select: { id: true, email: true },
      });
      if (!user) return null;
      return { userId: user.id, email: user.email };
```

With:
```typescript
      const user = await prisma.user.findUnique({
        where: { id: apiKey.userId },
        select: { id: true, email: true, settings: { select: { timezone: true } } },
      });
      if (!user) return null;
      return { userId: user.id, email: user.email, timezone: user.settings?.timezone ?? "UTC" };
```

- [ ] **Step 2: Update the cookie auth path in `getSession`**

Replace:
```typescript
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });
    if (!user) return null;
    return payload;
```

With:
```typescript
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, settings: { select: { timezone: true } } },
    });
    if (!user) return null;
    return { userId: user.id, email: user.email, timezone: user.settings?.timezone ?? "UTC" };
```

- [ ] **Step 3: Run ESLint**

```bash
pnpm exec eslint app/lib/auth.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/lib/auth.ts
git commit -m "feat: include timezone in session from UserSettings"
```

---

### Task 4: Allow `timezone` in settings API + add selector UI

**Files:**
- Modify: `app/api/settings/route.ts`
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Add `"timezone"` to allowed fields in settings API**

In `app/api/settings/route.ts`, find the `allowed` array and add `"timezone"`:

```typescript
  const allowed = [
    "defaultCurrency",
    "timezone",
    "loanBorrowedInitialCategoryId",
    // ... rest unchanged
  ] as const;
```

- [ ] **Step 2: Add timezone selector block to settings page**

In `app/settings/page.tsx`, add this block after the Display Currency block (after its closing `</div>`):

```tsx
      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium mb-0.5">Timezone</p>
        <p className="text-xs text-muted-foreground mb-3">Used to interpret dates you enter</p>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-[16px] md:text-sm"
          value={settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={(e) => updateMutation.mutate({ timezone: e.target.value })}
        >
          {Intl.supportedValuesOf("timeZone").map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
```

- [ ] **Step 3: Run ESLint**

```bash
pnpm exec eslint app/api/settings/route.ts app/settings/page.tsx
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start dev server (`pnpm dev`), navigate to Settings. Verify timezone selector appears, shows the browser's default timezone on first load, and saves successfully (check Network tab for `PUT /api/settings` returning the updated timezone).

- [ ] **Step 5: Commit**

```bash
git add app/api/settings/route.ts app/settings/page.tsx
git commit -m "feat: add timezone setting to user preferences"
```

---

### Task 5: Apply `parseDateParam` to transaction API routes

**Files:**
- Modify: `app/api/transactions/route.ts`
- Modify: `app/api/transactions/summary/route.ts`

- [ ] **Step 1: Update `app/api/transactions/route.ts`**

Add import at the top:
```typescript
import { parseDateParam } from "@/lib/dates";
```

In the GET handler, replace:
```typescript
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
```
With:
```typescript
              ...(startDate ? { gte: parseDateParam(startDate, session.timezone) } : {}),
              ...(endDate ? { lte: parseDateParam(endDate, session.timezone) } : {}),
```

In the POST handler, replace:
```typescript
      date: new Date(date),
```
With:
```typescript
      date: parseDateParam(date, session.timezone),
```

- [ ] **Step 2: Update `app/api/transactions/summary/route.ts`**

Add import at the top:
```typescript
import { parseDateParam } from "@/lib/dates";
```

Replace:
```typescript
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam ? new Date(endParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
```
With:
```typescript
  const start = startParam ? parseDateParam(startParam, session.timezone) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam ? parseDateParam(endParam, session.timezone) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
```

- [ ] **Step 3: Run ESLint**

```bash
pnpm exec eslint app/api/transactions/route.ts app/api/transactions/summary/route.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/transactions/route.ts app/api/transactions/summary/route.ts
git commit -m "feat: use parseDateParam in transactions API routes"
```

---

### Task 6: Apply `parseDateParam` to budgets and loan API routes

**Files:**
- Modify: `app/api/budgets/route.ts`
- Modify: `app/api/loans/loan-route-utils.ts`
- Modify: `app/api/loans/route.ts`
- Modify: `app/api/loans/[id]/payments/route.ts`

- [ ] **Step 1: Update `app/api/budgets/route.ts`**

Add import:
```typescript
import { parseDateParam } from "@/lib/dates";
```

In the POST handler, replace:
```typescript
      startDate: new Date(startDate ?? new Date()),
      endDate: period === "custom" ? new Date(endDate) : null,
```
With:
```typescript
      startDate: parseDateParam(startDate ?? new Date().toISOString(), session.timezone),
      endDate: period === "custom" ? parseDateParam(endDate, session.timezone) : null,
```

- [ ] **Step 2: Update `app/api/loans/loan-route-utils.ts`**

Add import:
```typescript
import { parseDateParam } from "@/lib/dates";
```

Update `parseLoanPayload` to accept timezone as second argument. Replace:
```typescript
export function parseLoanPayload(payload: LoanPayload) {
```
With:
```typescript
export function parseLoanPayload(payload: LoanPayload, timezone = "UTC") {
```

Replace:
```typescript
  const startDate = new Date(payload.startDate);
  if (Number.isNaN(startDate.getTime())) throw new Error("Start date is required");
```
With:
```typescript
  const startDate = parseDateParam(payload.startDate, timezone);
  if (Number.isNaN(startDate.getTime())) throw new Error("Start date is required");
```

Update `parseLoanPaymentPayload` similarly. Replace:
```typescript
export function parseLoanPaymentPayload(payload: LoanPaymentPayload) {
```
With:
```typescript
export function parseLoanPaymentPayload(payload: LoanPaymentPayload, timezone = "UTC") {
```

Replace:
```typescript
  const paymentDate = new Date(payload.paymentDate);
  if (Number.isNaN(paymentDate.getTime())) throw new Error("Payment date is required");
```
With:
```typescript
  const paymentDate = parseDateParam(payload.paymentDate, timezone);
  if (Number.isNaN(paymentDate.getTime())) throw new Error("Payment date is required");
```

- [ ] **Step 3: Pass `session.timezone` to loan utils in `app/api/loans/route.ts`**

Find the call to `parseLoanPayload` and add the timezone argument:
```typescript
  const parsed = parseLoanPayload(await req.json() as LoanPayload, session.timezone);
```

- [ ] **Step 4: Pass `session.timezone` to payment utils in `app/api/loans/[id]/payments/route.ts`**

Find the call to `parseLoanPaymentPayload` and add the timezone argument:
```typescript
  const parsed = parseLoanPaymentPayload(await req.json() as LoanPaymentPayload, session.timezone);
```

- [ ] **Step 5: Run ESLint**

```bash
pnpm exec eslint app/api/budgets/route.ts app/api/loans/loan-route-utils.ts app/api/loans/route.ts "app/api/loans/[id]/payments/route.ts"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/budgets/route.ts app/api/loans/loan-route-utils.ts app/api/loans/route.ts "app/api/loans/[id]/payments/route.ts"
git commit -m "feat: use parseDateParam in budgets and loans API routes"
```

---

### Task 7: Update frontend forms to send timezone-aware dates

**Files:**
- Modify: `components/transactions/transaction-form.tsx`
- Modify: `components/loans/loan-form.tsx`
- Modify: `components/loans/loan-payment-form.tsx`
- Modify: `components/budgets/budget-form.tsx`
- Modify: `components/transactions/time-range-selector.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `components/transactions/transaction-form.tsx`**

Add import:
```typescript
import { localDayToISO } from "@/lib/dates";
```

Find line 195 (the `onSubmit` call) where `date` is passed bare. The `date` variable is extracted from the input at line 182 as a `YYYY-MM-DD` string. Change the onSubmit call to convert it:
```typescript
      await onSubmit({ amount, date: localDayToISO(date), description: description || undefined, details: details || undefined, accountId, categoryId });
```

- [ ] **Step 2: Update `components/loans/loan-form.tsx`**

Add import:
```typescript
import { localDayToISO } from "@/lib/dates";
```

Find line 118 where `startDate` is extracted:
```typescript
      startDate: (form.elements.namedItem("startDate") as HTMLInputElement).value,
```
Replace with:
```typescript
      startDate: localDayToISO((form.elements.namedItem("startDate") as HTMLInputElement).value),
```

- [ ] **Step 3: Update `components/loans/loan-payment-form.tsx`**

Add import:
```typescript
import { localDayToISO } from "@/lib/dates";
```

Find line 61 where `paymentDate` is extracted:
```typescript
      paymentDate: (form.elements.namedItem("paymentDate") as HTMLInputElement).value,
```
Replace with:
```typescript
      paymentDate: localDayToISO((form.elements.namedItem("paymentDate") as HTMLInputElement).value),
```

- [ ] **Step 4: Update `components/budgets/budget-form.tsx`**

Add import:
```typescript
import { localDayToISO } from "@/lib/dates";
```

Find lines 65-69 where `startDate` and `endDate` are extracted:
```typescript
    const startDate = period === "custom"
      ? (form.elements.namedItem("startDate") as HTMLInputElement).value
      : undefined;
    const endDate = period === "custom"
      ? (form.elements.namedItem("endDate") as HTMLInputElement).value
      : undefined;
```
Replace with:
```typescript
    const rawStart = period === "custom"
      ? (form.elements.namedItem("startDate") as HTMLInputElement).value
      : undefined;
    const rawEnd = period === "custom"
      ? (form.elements.namedItem("endDate") as HTMLInputElement).value
      : undefined;
    const startDate = rawStart ? localDayToISO(rawStart) : undefined;
    const endDate = rawEnd ? localDayToISO(rawEnd) : undefined;
```

- [ ] **Step 5: Update `components/transactions/time-range-selector.tsx` custom range**

Add import:
```typescript
import { localStartOfDay, localEndOfDay } from "@/lib/dates";
```

The custom range is applied when the user picks dates in the inputs (lines 84-96). The `customRange` state holds bare `YYYY-MM-DD` strings. These are passed up to the parent as `startDate`/`endDate`. Find where the parent uses these values and ensure they're converted — the conversion should happen at the point of passing to the query, not in state.

In `time-range-selector.tsx`, the parent receives `onCustomRangeChange` with the raw strings from state. The conversion should happen at the point the range is consumed as query params. Find the component's export/props and check how `customRange` is forwarded. If the parent (`app/transactions/page.tsx`) passes the raw strings directly to the API, add the conversion there.

Check `app/transactions/page.tsx` for how `customRange` is used:
```bash
grep -n "customRange\|startDate\|endDate" app/transactions/page.tsx | head -15
```

If `customRange.startDate` is passed raw to the API params, wrap in `localStartOfDay`/`localEndOfDay` at that point:
```typescript
const dateRange = timeRange === "custom"
  ? {
      startDate: customRange.startDate ? localStartOfDay(customRange.startDate) : undefined,
      endDate: customRange.endDate ? localEndOfDay(customRange.endDate) : undefined,
    }
  : getDateRange(timeRange);
```

Add the import to `app/transactions/page.tsx`:
```typescript
import { localStartOfDay, localEndOfDay } from "@/lib/dates";
```

- [ ] **Step 6: Update `app/page.tsx` (dashboard date range)**

In `app/page.tsx`, the date range for the summary chart is built with `new Date(year, month, day)` which is already local time — those are already correct. Check lines 61-74: these use `new Date(year, month, day)` constructors (local time) and `.toISOString()`. The resulting ISO strings are UTC representations of local midnight — already correct. **No change needed for predefined ranges.**

The `fmt` function formats dates as `YYYY-MM-DD` bare strings. Check if those are passed as query params to the summary API:

```bash
grep -n "fmt\|startDate\|endDate\|queryParam\|params" app/page.tsx | head -20
```

If the `fmt` output is passed to the API, replace with `.toISOString()` on the same `Date` objects (which are already local-time-aware):
```typescript
// Before (if fmt() output is used as param):
params.startDate = fmt(start);
// After:
params.startDate = start.toISOString();
```

- [ ] **Step 7: Run ESLint on all modified frontend files**

```bash
pnpm exec eslint components/transactions/transaction-form.tsx components/loans/loan-form.tsx components/loans/loan-payment-form.tsx components/budgets/budget-form.tsx app/transactions/page.tsx
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add components/transactions/transaction-form.tsx components/loans/loan-form.tsx components/loans/loan-payment-form.tsx components/budgets/budget-form.tsx app/transactions/page.tsx
git commit -m "feat: send timezone-aware dates from frontend forms"
```

---

### Task 8: Update CLI `--date` flag

**Files:**
- Modify: `cli/index.ts`

- [ ] **Step 1: Add import for `localDayToISO` in `cli/index.ts`**

Add after the existing imports:
```typescript
import { localDayToISO } from "../lib/dates.js";
```

- [ ] **Step 2: Fix the `--date` flag in the `add` command**

Find in `cli/index.ts` (inside the `add` function):
```typescript
  const date = flag("date") ? new Date(flag("date")!).toISOString() : new Date().toISOString();
```
Replace with:
```typescript
  const date = flag("date") ? localDayToISO(flag("date")!) : new Date().toISOString();
```

- [ ] **Step 3: Run ESLint**

```bash
pnpm exec eslint cli/index.ts
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
./node_modules/.bin/vitest run
```

Expected: all tests pass (13 CLI tests + 7 dates tests).

- [ ] **Step 5: Commit**

```bash
git add cli/index.ts
git commit -m "feat: use localDayToISO for CLI --date flag"
```

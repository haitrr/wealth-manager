# Transaction Location via OpenTimeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional location to transactions by integrating with the user's self-hosted OpenTimeline instance — auto-suggesting place on date and falling back to manual search.

**Architecture:** A backend proxy layer in wealth-manager reads the OpenTimeline URL from `UserSettings` and forwards requests server-side (avoiding CORS). The transaction form auto-queries the proxy for a visit suggestion on the selected date; users can accept, clear, or manually search places. Location is stored as `locationPlaceId` + `locationPlaceName` on `Transaction`.

**Tech Stack:** Next.js App Router API routes, Prisma (PostgreSQL), React, react-query (`useQuery`/`useMutation`), axios, shadcn UI components, TypeScript, vitest.

## Global Constraints

- Mobile-first; use `text-[16px] md:text-sm` on any new inputs
- Use shadcn components (`Input`, `Button`, `Label`) from `@/components/ui/`
- API calls use `api` (axios instance) from `@/lib/axios`; server routes use `@/app/lib/db` for prisma and `@/app/lib/auth` for `getSession`
- No new dependencies — everything needed is already installed
- Run `pnpm exec eslint <path>` after each task to catch lint errors

---

### Task 1: DB migration — add location to Transaction and openTimelineUrl to UserSettings

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Transaction.locationPlaceId: String?`, `Transaction.locationPlaceName: String?`, `UserSettings.openTimelineUrl: String?` — all later tasks depend on these columns existing

- [ ] **Step 1: Edit prisma/schema.prisma — add openTimelineUrl to UserSettings**

In `prisma/schema.prisma`, add the field after the last `loanLentPrepayFeeCategoryId` line (line ~40):

```prisma
  loanLentPrepayFeeCategoryId     String?
  openTimelineUrl                 String?
  createdAt                       DateTime @default(now())
```

- [ ] **Step 2: Edit prisma/schema.prisma — add location fields to Transaction**

Find the `Transaction` model and add two fields before `createdAt`:

```prisma
  locationPlaceId    String?
  locationPlaceName  String?
  createdAt          DateTime            @default(now())
```

- [ ] **Step 3: Run migration**

```bash
pnpm exec prisma migrate dev --name add_location_to_transactions
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 4: Regenerate Prisma client**

```bash
pnpm exec prisma generate
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add location fields to Transaction and openTimelineUrl to UserSettings"
```

---

### Task 2: Settings API — expose openTimelineUrl

**Files:**
- Modify: `app/api/settings/route.ts`
- Modify: `lib/api/settings.ts`

**Interfaces:**
- Consumes: `UserSettings.openTimelineUrl` from Task 1
- Produces: `UserSettings.openTimelineUrl: string | null` in the API response; `UserSettingsPayload` now accepts `openTimelineUrl`

- [ ] **Step 1: Update `app/api/settings/route.ts` — add openTimelineUrl to allowed keys**

Find the `allowed` array and add the new key:

```typescript
  const allowed = [
    "defaultCurrency",
    "timezone",
    "loanBorrowedInitialCategoryId",
    "loanBorrowedPrincipalCategoryId",
    "loanBorrowedInterestCategoryId",
    "loanBorrowedPrepayFeeCategoryId",
    "loanLentInitialCategoryId",
    "loanLentPrincipalCategoryId",
    "loanLentInterestCategoryId",
    "loanLentPrepayFeeCategoryId",
    "openTimelineUrl",
  ] as const;
```

- [ ] **Step 2: Update `lib/api/settings.ts` — add openTimelineUrl to interface and payload type**

Add `openTimelineUrl: string | null;` to `UserSettings`:

```typescript
export interface UserSettings {
  id: string;
  userId: string;
  defaultCurrency: Currency;
  timezone: string;
  loanBorrowedInitialCategoryId: string | null;
  loanBorrowedPrincipalCategoryId: string | null;
  loanBorrowedInterestCategoryId: string | null;
  loanBorrowedPrepayFeeCategoryId: string | null;
  loanLentInitialCategoryId: string | null;
  loanLentPrincipalCategoryId: string | null;
  loanLentInterestCategoryId: string | null;
  loanLentPrepayFeeCategoryId: string | null;
  openTimelineUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Update `UserSettingsPayload` to include `openTimelineUrl`:

```typescript
export type UserSettingsPayload = Partial<Pick<
  UserSettings,
  | "defaultCurrency"
  | "timezone"
  | "loanBorrowedInitialCategoryId"
  | "loanBorrowedPrincipalCategoryId"
  | "loanBorrowedInterestCategoryId"
  | "loanBorrowedPrepayFeeCategoryId"
  | "loanLentInitialCategoryId"
  | "loanLentPrincipalCategoryId"
  | "loanLentInterestCategoryId"
  | "loanLentPrepayFeeCategoryId"
  | "openTimelineUrl"
>>;
```

- [ ] **Step 3: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint lib/api/settings.ts app/api/settings/route.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/settings/route.ts lib/api/settings.ts
git commit -m "feat: expose openTimelineUrl in settings API"
```

---

### Task 3: OpenTimeline proxy API routes

**Files:**
- Create: `app/api/integrations/opentimeline/visits/route.ts`
- Create: `app/api/integrations/opentimeline/places/route.ts`

**Interfaces:**
- Consumes: `UserSettings.openTimelineUrl` (read from DB); `getSession` from `@/app/lib/auth`; `prisma` from `@/app/lib/db`
- Produces:
  - `GET /api/integrations/opentimeline/visits?at=<ISO>` → `{ placeId: string; placeName: string } | null`
  - `GET /api/integrations/opentimeline/places?q=<string>` → `{ places: { id: string; name: string }[] }`

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/haitran/code/wealth-manager/app/api/integrations/opentimeline/visits
mkdir -p /Users/haitran/code/wealth-manager/app/api/integrations/opentimeline/places
```

- [ ] **Step 2: Create `app/api/integrations/opentimeline/visits/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const at = req.nextUrl.searchParams.get("at");
  if (!at) return NextResponse.json({ error: "at parameter required" }, { status: 400 });

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.userId } });
  if (!settings?.openTimelineUrl) {
    return NextResponse.json(null);
  }

  const atDate = new Date(at);
  if (isNaN(atDate.getTime())) {
    return NextResponse.json({ error: "Invalid at parameter" }, { status: 400 });
  }

  // Query the full day so partial-day visits are included
  const dayStart = new Date(atDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(atDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  try {
    const url = new URL("/api/visits", settings.openTimelineUrl);
    url.searchParams.set("start", dayStart.toISOString());
    url.searchParams.set("end", dayEnd.toISOString());
    url.searchParams.set("status", "confirmed");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json(null);

    const visits: { placeId: number; place?: { id: number; name: string } }[] = await res.json();
    if (!visits.length) return NextResponse.json(null);

    const first = visits[0];
    const placeId = String(first.placeId ?? first.place?.id);
    const placeName = first.place?.name ?? "";
    if (!placeId || !placeName) return NextResponse.json(null);

    return NextResponse.json({ placeId, placeName });
  } catch {
    return NextResponse.json(null);
  }
}
```

- [ ] **Step 3: Create `app/api/integrations/opentimeline/places/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ places: [] });

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.userId } });
  if (!settings?.openTimelineUrl) {
    return NextResponse.json({ places: [] });
  }

  try {
    const url = new URL("/api/places", settings.openTimelineUrl);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json({ places: [] });

    const raw: { id: number; name: string }[] = await res.json();
    const places = raw.map((p) => ({ id: String(p.id), name: p.name }));
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
```

- [ ] **Step 4: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint app/api/integrations/
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/integrations/
git commit -m "feat: add OpenTimeline proxy API routes for visits and places"
```

---

### Task 4: Client-side OpenTimeline API lib

**Files:**
- Create: `lib/api/opentimeline.ts`

**Interfaces:**
- Consumes: `api` (axios) from `@/lib/axios`; proxy routes from Task 3
- Produces:
  - `getVisitSuggestion(date: string): Promise<{ placeId: string; placeName: string } | null>`
  - `searchPlaces(q: string): Promise<{ id: string; name: string }[]>`

- [ ] **Step 1: Create `lib/api/opentimeline.ts`**

```typescript
import api from "@/lib/axios";

export interface OpenTimelinePlace {
  id: string;
  name: string;
}

export async function getVisitSuggestion(date: string): Promise<OpenTimelinePlace | null> {
  const { data } = await api.get<OpenTimelinePlace | null>(
    "/integrations/opentimeline/visits",
    { params: { at: date } }
  );
  return data;
}

export async function searchPlaces(q: string): Promise<OpenTimelinePlace[]> {
  const { data } = await api.get<{ places: OpenTimelinePlace[] }>(
    "/integrations/opentimeline/places",
    { params: { q } }
  );
  return data.places;
}
```

- [ ] **Step 2: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint lib/api/opentimeline.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/api/opentimeline.ts
git commit -m "feat: add client-side OpenTimeline API lib"
```

---

### Task 5: OpenTimeline URL setting in settings page

**Files:**
- Modify: `app/settings/page.tsx`

**Interfaces:**
- Consumes: `getSettings`, `updateSettings`, `UserSettingsPayload` from `@/lib/api/settings` (updated in Task 2)

- [ ] **Step 1: Add OpenTimeline URL section to settings page**

In `app/settings/page.tsx`, add a new section after the Timezone block (before the `SETTINGS_ITEMS` list block). Add the import for `Link2` icon at the top of the icons import list:

```typescript
import { ChevronRight, CreditCard, Tag, User, DollarSign, Upload, Landmark, PiggyBank, Building2, HandCoins, Link2 } from "lucide-react";
```

Then add the section in JSX after the timezone block:

```tsx
      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium mb-0.5 flex items-center gap-2">
          <Link2 className="size-4" />
          OpenTimeline
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Connect your OpenTimeline instance to auto-suggest locations on transactions
        </p>
        <input
          type="url"
          placeholder="http://localhost:3000"
          defaultValue={settings?.openTimelineUrl ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-[16px] md:text-sm"
          onBlur={(e) => {
            const val = e.target.value.trim();
            updateMutation.mutate({ openTimelineUrl: val || null });
          }}
        />
      </div>
```

- [ ] **Step 2: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint app/settings/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Manual test — open settings page**

Run `pnpm dev`, navigate to `/settings`. Verify the OpenTimeline section appears with a URL input. Enter a URL, tab away, then reload the page — the URL should persist.

- [ ] **Step 4: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add OpenTimeline URL setting to settings page"
```

---

### Task 6: LocationPicker component

**Files:**
- Create: `components/transactions/location-picker.tsx`

**Interfaces:**
- Consumes: `getVisitSuggestion`, `searchPlaces`, `OpenTimelinePlace` from `@/lib/api/opentimeline`; `useQuery` from `@tanstack/react-query`; `Input`, `Button`, `Label` from `@/components/ui/`
- Produces: `LocationPicker` component with props:
  ```typescript
  interface LocationPickerProps {
    date: string;             // YYYY-MM-DD
    value: OpenTimelinePlace | null;
    onChange: (value: OpenTimelinePlace | null) => void;
  }
  ```

- [ ] **Step 1: Create `components/transactions/location-picker.tsx`**

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVisitSuggestion, searchPlaces, OpenTimelinePlace } from "@/lib/api/opentimeline";
import { getSettings } from "@/lib/api/settings";

interface LocationPickerProps {
  date: string;
  value: OpenTimelinePlace | null;
  onChange: (value: OpenTimelinePlace | null) => void;
}

export function LocationPicker({ date, value, onChange }: LocationPickerProps) {
  // All hooks must be called unconditionally before any early return
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [dismissed, setDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const prevDateRef = useRef(date);

  // Reset dismissed state when date changes
  useEffect(() => {
    if (prevDateRef.current !== date) {
      prevDateRef.current = date;
      setDismissed(false);
      setSearchQuery("");
    }
  }, [date]);

  const { data: suggestion, isLoading: isSuggesting } = useQuery({
    queryKey: ["opentimeline-visit", date],
    queryFn: () => getVisitSuggestion(date),
    enabled: !!date && !value && !dismissed && !!settings?.openTimelineUrl,
    retry: false,
    staleTime: 60_000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["opentimeline-places", searchQuery],
    queryFn: () => searchPlaces(searchQuery),
    enabled: searchQuery.length >= 2 && !!settings?.openTimelineUrl,
    retry: false,
    staleTime: 30_000,
  });

  // Hidden entirely when OpenTimeline is not configured
  if (!settings?.openTimelineUrl) return null;

  // Confirmed value — show with clear button
  if (value) {
    return (
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <MapPin className="size-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => { onChange(null); setDismissed(false); }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear location"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Auto-suggestion available
  if (!dismissed && suggestion) {
    return (
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          <MapPin className="size-4 text-primary shrink-0" />
          <span className="flex-1 truncate text-foreground">{suggestion.name}</span>
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            className="text-xs font-medium text-primary hover:text-primary/80 shrink-0"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss suggestion"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Suggestion loading
  if (!dismissed && isSuggesting) {
    return (
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
          <MapPin className="size-4 shrink-0" />
          <span>Looking up location…</span>
        </div>
      </div>
    );
  }

  // Manual search
  return (
    <div className="space-y-2">
      <Label>Location (optional)</Label>
      <div className="relative">
        <div className="flex items-center rounded-md border border-input bg-background px-3 gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="text"
            placeholder="Search location…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="border-0 shadow-none px-0 text-[16px] md:text-sm focus-visible:ring-0"
          />
        </div>
        {showDropdown && searchResults.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
            {searchResults.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onMouseDown={() => { onChange(place); setSearchQuery(""); setShowDropdown(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                >
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint components/transactions/location-picker.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/transactions/location-picker.tsx
git commit -m "feat: add LocationPicker component with auto-suggest and manual search"
```

---

### Task 7: Wire location through Transaction type, form, and page

**Files:**
- Modify: `lib/api/transactions.ts`
- Modify: `components/transactions/transaction-form.tsx`
- Modify: `app/transactions/page.tsx`

**Interfaces:**
- Consumes: `LocationPicker` from `@/components/transactions/location-picker`; `OpenTimelinePlace` from `@/lib/api/opentimeline`
- Produces: `Transaction.locationPlaceId: string | null`, `Transaction.locationPlaceName: string | null` in the TypeScript type; updated `createTransaction` / `updateTransaction` payloads; updated form `onSubmit` signature

- [ ] **Step 1: Update `lib/api/transactions.ts` — add location fields to Transaction interface and payloads**

Add to `Transaction` interface (after `details`):

```typescript
export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  details: string | null;
  locationPlaceId: string | null;
  locationPlaceName: string | null;
  accountId: string;
  account: { id: string; name: string; currency: Currency };
  categoryId: string;
  category: { id: string; name: string; type: CategoryType; icon: string | null };
  userId: string;
  createdAt: string;
  updatedAt: string;
  loanPaymentPrincipal: { id: string; loanId: string; loan: { id: string; name: string } } | null;
  loanPaymentInterest: { id: string; loanId: string; loan: { id: string; name: string } } | null;
  loanPaymentPrepayFee: { id: string; loanId: string; loan: { id: string; name: string } } | null;
}
```

Update `createTransaction` payload type:

```typescript
export async function createTransaction(payload: {
  amount: number;
  date: string;
  description?: string;
  details?: string;
  accountId: string;
  categoryId: string;
  locationPlaceId?: string | null;
  locationPlaceName?: string | null;
}): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/transactions", payload);
  return data;
}
```

Update `updateTransaction` payload type:

```typescript
export async function updateTransaction(
  id: string,
  payload: {
    amount: number;
    date: string;
    description?: string;
    details?: string;
    accountId: string;
    categoryId: string;
    locationPlaceId?: string | null;
    locationPlaceName?: string | null;
  }
): Promise<Transaction> {
  const { data } = await api.put<Transaction>(`/transactions/${id}`, payload);
  return data;
}
```

- [ ] **Step 2: Update backend route `app/api/transactions/route.ts` — include location in SELECT and Prisma query**

In the raw SQL SELECT for search, add location fields after `t.details`:

```sql
t.id, t.amount, t.date, t.description, t.details,
t."locationPlaceId", t."locationPlaceName",
t."accountId", ...
```

In the `prisma.transaction.findMany` select (non-search path), the fields are returned automatically since they're on the model. No change needed there.

In the `POST` handler, extract and persist location fields from request body. Find the POST handler body extraction and add:

```typescript
const { amount, date, description, details, accountId, categoryId, locationPlaceId, locationPlaceName } = await req.json();
```

And in `prisma.transaction.create`:

```typescript
data: {
  amount: parseFloat(amount),
  date: parseDateParam(date, session.timezone),
  description: description?.trim() || null,
  details: details?.trim() || null,
  locationPlaceId: locationPlaceId?.trim() || null,
  locationPlaceName: locationPlaceName?.trim() || null,
  accountId,
  categoryId,
  userId: session.userId,
},
```

- [ ] **Step 3: Update backend route `app/api/transactions/[id]/route.ts` — persist location on update**

In the PUT handler, extract location fields:

```typescript
const { amount, date, description, details, accountId, categoryId, locationPlaceId, locationPlaceName } = await req.json();
```

And in `prisma.transaction.update`:

```typescript
data: {
  amount: parseFloat(amount),
  date: parseDateParam(date, session.timezone),
  description: description?.trim() || null,
  details: details?.trim() || null,
  locationPlaceId: locationPlaceId?.trim() || null,
  locationPlaceName: locationPlaceName?.trim() || null,
  accountId,
  categoryId,
},
```

- [ ] **Step 4: Update `components/transactions/transaction-form.tsx` — add LocationPicker**

Add imports at the top:

```typescript
import { useState, useEffect, FormEvent } from "react";
import { LocationPicker } from "@/components/transactions/location-picker";
import { OpenTimelinePlace } from "@/lib/api/opentimeline";
```

Update `TransactionFieldsProps` to include location:

```typescript
interface TransactionFieldsProps {
  transaction?: Transaction | null;
  accounts: Account[];
  categories: TransactionCategory[];
  defaultDate: string;
  defaultAccountId: string;
  error: string;
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  location: OpenTimelinePlace | null;
  onLocationChange: (value: OpenTimelinePlace | null) => void;
}
```

Inside `TransactionFields`, add the `location` and `onLocationChange` destructure, and render `LocationPicker` after the Details field:

```typescript
function TransactionFields({
  transaction,
  accounts,
  categories,
  defaultDate,
  defaultAccountId,
  error,
  selectedCategoryId,
  onCategoryChange,
  location,
  onLocationChange,
}: TransactionFieldsProps) {
  const [date, setDate] = useState(defaultDate);
  // ... existing shiftDate function unchanged ...

  return (
    <div className="space-y-4 py-2">
      {/* ... all existing fields unchanged ... */}

      {/* Add after the Details textarea block: */}
      <LocationPicker
        date={date}
        value={location}
        onChange={onLocationChange}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

Update `TransactionFormProps.onSubmit` to include location:

```typescript
onSubmit: (data: {
  amount: number;
  date: string;
  description?: string;
  details?: string;
  accountId: string;
  categoryId: string;
  locationPlaceId?: string | null;
  locationPlaceName?: string | null;
}) => Promise<void>;
```

In `TransactionForm`, add location state and wire it through:

```typescript
export function TransactionForm({ open, transaction, accounts, categories, onClose, onSubmit, onDelete }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(transaction?.categoryId ?? "");
  const [location, setLocation] = useState<OpenTimelinePlace | null>(
    transaction?.locationPlaceId && transaction?.locationPlaceName
      ? { id: transaction.locationPlaceId, name: transaction.locationPlaceName }
      : null
  );

  useEffect(() => {
    setSelectedCategoryId(transaction?.categoryId ?? "");
    setLocation(
      transaction?.locationPlaceId && transaction?.locationPlaceName
        ? { id: transaction.locationPlaceId, name: transaction.locationPlaceName }
        : null
    );
  }, [transaction?.id, transaction?.categoryId, transaction?.locationPlaceId]);
```

In `handleSubmit`, add location to the `onSubmit` call:

```typescript
await onSubmit({
  amount,
  date: localDayToISO(date),
  description: description || undefined,
  details: details || undefined,
  accountId,
  categoryId,
  locationPlaceId: location?.id ?? null,
  locationPlaceName: location?.name ?? null,
});
```

Pass `location` and `onLocationChange` to `TransactionFields`:

```tsx
<TransactionFields
  key={transaction?.id ?? "new"}
  transaction={transaction}
  accounts={accounts}
  categories={categories}
  defaultDate={defaultDate}
  defaultAccountId={defaultAccount?.id ?? ""}
  error={error}
  selectedCategoryId={selectedCategoryId}
  onCategoryChange={setSelectedCategoryId}
  location={location}
  onLocationChange={setLocation}
/>
```

- [ ] **Step 5: Update `app/transactions/page.tsx` — pass location through mutations**

Update the `updateMutation` inline type:

```typescript
const updateMutation = useMutation({
  mutationFn: ({
    id,
    ...payload
  }: {
    id: string;
    amount: number;
    date: string;
    description?: string;
    details?: string;
    accountId: string;
    categoryId: string;
    locationPlaceId?: string | null;
    locationPlaceName?: string | null;
  }) => updateTransaction(id, payload),
  onSuccess: invalidate,
});
```

Update `handleSubmit` type:

```typescript
async function handleSubmit(payload: {
  amount: number;
  date: string;
  description?: string;
  details?: string;
  accountId: string;
  categoryId: string;
  locationPlaceId?: string | null;
  locationPlaceName?: string | null;
}) {
  if (editingTransaction) {
    await updateMutation.mutateAsync({ id: editingTransaction.id, ...payload });
  } else {
    await createMutation.mutateAsync(payload);
  }
}
```

- [ ] **Step 6: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint lib/api/transactions.ts components/transactions/transaction-form.tsx app/transactions/page.tsx app/api/transactions/route.ts "app/api/transactions/[id]/route.ts"
```

Expected: no errors.

- [ ] **Step 7: Manual test — add and edit a transaction with location**

Run `pnpm dev`. Open the Add Transaction dialog. Verify:
- If OpenTimeline is not configured: location field shows search input (no auto-suggest)
- If OpenTimeline is configured with a URL: location auto-suggests on load
- Accepting a suggestion sets it; clearing it shows search input
- Manually searching and picking a place saves correctly
- Editing an existing transaction pre-fills the location

- [ ] **Step 8: Commit**

```bash
git add lib/api/transactions.ts components/transactions/transaction-form.tsx app/transactions/page.tsx app/api/transactions/route.ts "app/api/transactions/[id]/route.ts"
git commit -m "feat: wire location through transaction types, form, and API routes"
```

---

### Task 8: Display location in transaction list and detail

**Files:**
- Modify: `components/transactions/transaction-row.tsx`
- Modify: `components/transactions/transaction-detail.tsx`

**Interfaces:**
- Consumes: `Transaction.locationPlaceName` from updated type in Task 7

- [ ] **Step 1: Update `components/transactions/transaction-row.tsx` — show locationPlaceName**

Add `MapPin` to the lucide import:

```typescript
import { Landmark, MapPin } from "lucide-react";
```

In the row JSX, after the description/category-name `<p>`, add location display inside the same `<div className="min-w-0">`:

```tsx
<div className="min-w-0">
  <div className="flex items-center gap-2">
    <p className="font-medium text-sm truncate">
      {transaction.description || transaction.category.name}
    </p>
  </div>
  {transaction.locationPlaceName && (
    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
      <MapPin className="size-3 shrink-0" />
      {transaction.locationPlaceName}
    </p>
  )}
  {/* existing loan payment display unchanged */}
</div>
```

- [ ] **Step 2: Update `components/transactions/transaction-detail.tsx` — show locationPlaceName**

Add `MapPin` to the lucide import at the top of the file.

In the detail view JSX, find where `details` is displayed and add location after it. The exact location depends on the detail component's structure — add it as a row in the info grid with the same pattern as other fields:

```tsx
{tx.locationPlaceName && (
  <div className="flex items-start gap-2 text-sm">
    <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
    <span>{tx.locationPlaceName}</span>
  </div>
)}
```

- [ ] **Step 3: Verify TypeScript and lint**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint components/transactions/transaction-row.tsx components/transactions/transaction-detail.tsx
```

Expected: no errors.

- [ ] **Step 4: Manual test — verify location appears in list and detail**

Run `pnpm dev`. Create a transaction with a location. Verify:
- Location name appears as a secondary line under the description in the transaction list
- Location name appears in the transaction detail view
- Transactions without a location are unaffected

- [ ] **Step 5: Commit**

```bash
git add components/transactions/transaction-row.tsx components/transactions/transaction-detail.tsx
git commit -m "feat: display location in transaction list and detail views"
```

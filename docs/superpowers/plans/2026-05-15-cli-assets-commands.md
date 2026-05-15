# CLI Assets Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `wm assets [add|update|delete|refresh]` subcommands to the wealth manager CLI covering full CRUD and price refresh.

**Architecture:** Extract all asset logic into a new `cli/assets.ts` file that receives shared CLI utilities as a dependency object, keeping `cli/index.ts` from growing past the 300-line threshold. The router in `index.ts` dispatches to `assetsCommand()` when `command === "assets"`.

**Tech Stack:** TypeScript, axios, tsx (no test framework is set up — verification is done by running the CLI manually against the dev server)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `cli/assets.ts` | Create | All 5 asset command handlers (list, add, update, delete, refresh) |
| `cli/index.ts` | Modify | Add assets router entry + help text + export shared CliDeps type |

---

### Task 1: Create `cli/assets.ts` with `list` subcommand

**Files:**
- Create: `cli/assets.ts`

- [ ] **Step 1: Create the file with shared deps type and `list` handler**

```typescript
// cli/assets.ts
import type { AxiosInstance } from "axios";

export interface CliDeps {
  http: AxiosInstance;
  flag: (name: string) => string | undefined;
  positional: (index: number) => string | undefined;
  jsonOutput: boolean;
  printJson: (data: unknown) => void;
  table: (
    headers: string[],
    rows: string[][],
    opts?: { align?: ("left" | "right")[] }
  ) => void;
  fmt: (n: number, decimals?: number) => string;
  fmtDate: (iso: string) => string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentValue: number;
  quantity: number | null;
  ticker: string | null;
  lastPricedAt: string | null;
}

async function listAssets(d: CliDeps): Promise<void> {
  const { data } = await d.http.get<Asset[]>("/api/assets");
  if (d.jsonOutput) { d.printJson(data); return; }

  const rows = data.map((a) => [
    a.id,
    a.name,
    a.type,
    a.currency,
    d.fmt(a.currentValue),
    a.quantity != null ? String(a.quantity) : "—",
    a.ticker ?? "—",
    a.lastPricedAt ? d.fmtDate(a.lastPricedAt) : "—",
  ]);
  d.table(
    ["ID", "Name", "Type", "Currency", "Value", "Quantity", "Ticker", "Last Priced"],
    rows,
    { align: ["left", "left", "left", "left", "right", "right", "left", "left"] }
  );
}

export async function assetsCommand(d: CliDeps): Promise<void> {
  const sub = d.positional(1);
  if (!sub || sub === "list") return listAssets(d);

  console.error(`Unknown assets subcommand: ${sub}`);
  console.error("Usage: wm assets [add|update|delete|refresh]");
  process.exit(1);
}
```

- [ ] **Step 2: Wire assets into `cli/index.ts` router**

In `cli/index.ts`, add the import at the top (after existing imports):

```typescript
import { assetsCommand, type CliDeps } from "./assets.js";
```

In the `commands` map inside `main()`, add the entry (before the closing `}`):

```typescript
    assets: () => assetsCommand({ http, flag, positional, jsonOutput, printJson, table, fmt, fmtDate }),
```

- [ ] **Step 3: Add `assets` section to the `help()` function**

Inside the `help()` template string, add after the `exchange-rates` line:

```
  assets                                List all assets
    assets add <name> <type> <value>    Create an asset
      --currency USD|VND  (default: USD)
      --ticker SYMBOL     Required for stock
      --quantity N        Required for stock or gold
    assets update <id>                  Update an asset (patch any field)
      --name TEXT  --value N  --currency USD|VND  --ticker SYMBOL  --quantity N
    assets delete <id>                  Delete an asset
    assets refresh <id>                 Refresh price (stock or gold only)
```

- [ ] **Step 4: Manual smoke test — list**

Start the dev server (`pnpm dev`) then run:
```
tsx cli/index.ts assets
```
Expected: table of assets (or empty table if none exist). No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add cli/assets.ts cli/index.ts
git commit -m "feat: add wm assets list subcommand"
```

---

### Task 2: Add `add` subcommand

**Files:**
- Modify: `cli/assets.ts`

- [ ] **Step 1: Add the `addAsset` handler in `cli/assets.ts`**

Insert before `assetsCommand`:

```typescript
const VALID_TYPES = ["real_estate", "stock", "bond", "gold"];
const VALID_CURRENCIES = ["USD", "VND"];

async function addAsset(d: CliDeps): Promise<void> {
  const name = d.positional(2);
  const type = d.positional(3);
  const valueStr = d.positional(4);

  if (!name || !type || !valueStr) {
    console.error("Usage: wm assets add <name> <type> <value> [--currency USD|VND] [--ticker SYMBOL] [--quantity N]");
    console.error(`Valid types: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    console.error(`Invalid type: "${type}". Valid types: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  const currentValue = parseFloat(valueStr);
  if (!Number.isFinite(currentValue) || currentValue < 0) {
    console.error(`Invalid value: "${valueStr}"`);
    process.exit(1);
  }

  const currency = d.flag("currency") ?? "USD";
  if (!VALID_CURRENCIES.includes(currency)) {
    console.error(`Invalid currency: "${currency}". Valid: ${VALID_CURRENCIES.join(", ")}`);
    process.exit(1);
  }

  const ticker = d.flag("ticker") ?? null;
  const quantityStr = d.flag("quantity");
  const quantity = quantityStr != null ? parseFloat(quantityStr) : null;

  const { data } = await d.http.post<Asset>("/api/assets", {
    name,
    type,
    currentValue,
    currency,
    ticker,
    quantity,
  });

  if (d.jsonOutput) { d.printJson(data); return; }
  console.log(`Added [${data.id}]: ${data.name} (${data.type}) — ${data.currency} ${d.fmt(data.currentValue)}`);
}
```

- [ ] **Step 2: Wire `add` into `assetsCommand` dispatcher**

Replace the `assetsCommand` function body:

```typescript
export async function assetsCommand(d: CliDeps): Promise<void> {
  const sub = d.positional(1);
  if (!sub || sub === "list") return listAssets(d);
  if (sub === "add") return addAsset(d);

  console.error(`Unknown assets subcommand: ${sub}`);
  console.error("Usage: wm assets [add|update|delete|refresh]");
  process.exit(1);
}
```

- [ ] **Step 3: Manual smoke test — add**

```bash
tsx cli/index.ts assets add "My House" real_estate 500000 --currency VND
```
Expected: `Added [<id>]: My House (real_estate) — VND 500,000.00`

```bash
tsx cli/index.ts assets add "Apple" stock 1500 --ticker AAPL --quantity 10
```
Expected: `Added [<id>]: Apple (stock) — USD 1,500.00`

- [ ] **Step 4: Commit**

```bash
git add cli/assets.ts
git commit -m "feat: add wm assets add subcommand"
```

---

### Task 3: Add `update` subcommand

**Files:**
- Modify: `cli/assets.ts`

The PATCH API endpoint runs the same `parseAssetPayload` as POST (requires name + type). So update must GET the current asset first, merge provided flags, then PATCH.

- [ ] **Step 1: Add the `updateAsset` handler**

Insert before `assetsCommand`:

```typescript
async function updateAsset(d: CliDeps): Promise<void> {
  const id = d.positional(2);
  if (!id) {
    console.error("Usage: wm assets update <id> [--name TEXT] [--value N] [--currency USD|VND] [--ticker SYMBOL] [--quantity N]");
    process.exit(1);
  }

  const name = d.flag("name");
  const valueStr = d.flag("value");
  const currency = d.flag("currency");
  const ticker = d.flag("ticker");
  const quantityStr = d.flag("quantity");

  if (!name && !valueStr && !currency && !ticker && !quantityStr) {
    console.error("Provide at least one field to update: --name, --value, --currency, --ticker, --quantity");
    process.exit(1);
  }

  // Fetch current values so the PATCH payload is always complete
  const { data: current } = await d.http.get<Asset>(`/api/assets/${id}`);

  const currentValue = valueStr != null ? parseFloat(valueStr) : current.currentValue;
  if (!Number.isFinite(currentValue) || currentValue < 0) {
    console.error(`Invalid value: "${valueStr}"`);
    process.exit(1);
  }

  const quantity = quantityStr != null ? parseFloat(quantityStr) : current.quantity;

  const payload = {
    name: name ?? current.name,
    type: current.type,
    currency: currency ?? current.currency,
    currentValue,
    ticker: ticker ?? current.ticker,
    quantity,
  };

  const { data: updated } = await d.http.patch<Asset>(`/api/assets/${id}`, payload);

  if (d.jsonOutput) { d.printJson(updated); return; }
  console.log(`Updated [${updated.id}]: ${updated.name} (${updated.type}) — ${updated.currency} ${d.fmt(updated.currentValue)}`);
}
```

- [ ] **Step 2: Wire `update` into `assetsCommand` dispatcher**

```typescript
export async function assetsCommand(d: CliDeps): Promise<void> {
  const sub = d.positional(1);
  if (!sub || sub === "list") return listAssets(d);
  if (sub === "add") return addAsset(d);
  if (sub === "update") return updateAsset(d);

  console.error(`Unknown assets subcommand: ${sub}`);
  console.error("Usage: wm assets [add|update|delete|refresh]");
  process.exit(1);
}
```

- [ ] **Step 3: Manual smoke test — update**

```bash
# Get an existing asset ID first
tsx cli/index.ts assets --json | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])"

# Update its name
tsx cli/index.ts assets update <id> --name "Updated Name"
```
Expected: `Updated [<id>]: Updated Name (...)`

- [ ] **Step 4: Commit**

```bash
git add cli/assets.ts
git commit -m "feat: add wm assets update subcommand"
```

---

### Task 4: Add `delete` subcommand

**Files:**
- Modify: `cli/assets.ts`

- [ ] **Step 1: Add the `deleteAsset` handler**

Insert before `assetsCommand`:

```typescript
async function deleteAsset(d: CliDeps): Promise<void> {
  const id = d.positional(2);
  if (!id) {
    console.error("Usage: wm assets delete <id>");
    process.exit(1);
  }
  await d.http.delete(`/api/assets/${id}`);
  if (d.jsonOutput) { d.printJson({ success: true, id }); return; }
  console.log(`Deleted asset ${id}.`);
}
```

- [ ] **Step 2: Wire `delete` into `assetsCommand` dispatcher**

```typescript
export async function assetsCommand(d: CliDeps): Promise<void> {
  const sub = d.positional(1);
  if (!sub || sub === "list") return listAssets(d);
  if (sub === "add") return addAsset(d);
  if (sub === "update") return updateAsset(d);
  if (sub === "delete") return deleteAsset(d);

  console.error(`Unknown assets subcommand: ${sub}`);
  console.error("Usage: wm assets [add|update|delete|refresh]");
  process.exit(1);
}
```

- [ ] **Step 3: Manual smoke test — delete**

```bash
# Add a throwaway asset
tsx cli/index.ts assets add "Temp Bond" bond 1000
# Copy the ID from output, then delete it
tsx cli/index.ts assets delete <id>
```
Expected: `Deleted asset <id>.`

- [ ] **Step 4: Commit**

```bash
git add cli/assets.ts
git commit -m "feat: add wm assets delete subcommand"
```

---

### Task 5: Add `refresh` subcommand

**Files:**
- Modify: `cli/assets.ts`

- [ ] **Step 1: Add the `refreshAsset` handler**

Insert before `assetsCommand`:

```typescript
async function refreshAsset(d: CliDeps): Promise<void> {
  const id = d.positional(2);
  if (!id) {
    console.error("Usage: wm assets refresh <id>");
    process.exit(1);
  }
  const { data: updated } = await d.http.post<Asset>(`/api/assets/${id}/refresh-price`);
  if (d.jsonOutput) { d.printJson(updated); return; }
  console.log(`Refreshed [${updated.id}]: ${updated.name} — ${updated.currency} ${d.fmt(updated.currentValue)} (priced ${updated.lastPricedAt ? d.fmtDate(updated.lastPricedAt) : "now"})`);
}
```

- [ ] **Step 2: Wire `refresh` into `assetsCommand` dispatcher**

```typescript
export async function assetsCommand(d: CliDeps): Promise<void> {
  const sub = d.positional(1);
  if (!sub || sub === "list") return listAssets(d);
  if (sub === "add") return addAsset(d);
  if (sub === "update") return updateAsset(d);
  if (sub === "delete") return deleteAsset(d);
  if (sub === "refresh") return refreshAsset(d);

  console.error(`Unknown assets subcommand: ${sub}`);
  console.error("Usage: wm assets [add|update|delete|refresh]");
  process.exit(1);
}
```

- [ ] **Step 3: Manual smoke test — refresh**

```bash
# Use an existing stock or gold asset ID
tsx cli/index.ts assets refresh <id>
```
Expected: `Refreshed [<id>]: Apple — USD 1,650.00 (priced 2026-05-15)`

For a non-stock/gold asset, the API returns 400 — verify the axios error handler prints it cleanly:
```bash
tsx cli/index.ts assets refresh <real_estate_id>
```
Expected: `API error 400: { error: "Price refresh is only supported for stocks and gold" }`

- [ ] **Step 4: Run ESLint to catch any issues**

```bash
pnpm exec eslint cli/assets.ts cli/index.ts
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add cli/assets.ts cli/index.ts
git commit -m "feat: add wm assets refresh subcommand"
```

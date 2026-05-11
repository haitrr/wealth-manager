Use the wealth manager CLI to answer questions about finances and handle expense tracking.

## Setup

Config is stored in `~/.wm/config.yml`. If the user hasn't configured the CLI yet, run:
```bash
wm config
```
This prompts for the API key (generate one in the app under **Settings > API Keys**) and base URL.

The app must be running (default: `http://localhost:3000`).

## Available commands

All commands use `pnpm wm <command>`. Run them with Bash tool.

### View accounts
```bash
pnpm wm accounts
```
Sample output:
```
ID                         Name        Currency  Balance        Default
─────────────────────────  ──────────  ────────  ─────────────  ───────
cmmrq5pvx002k01nz3r418p6r  Cash        VND       92,291,401.00
cmmrq5pvz002l01nz0232e86b  USD         USD             -109.20
```

### View transactions
```bash
pnpm wm transactions
pnpm wm transactions --from 2026-03-01 --to 2026-03-31
pnpm wm transactions --limit 10
pnpm wm transactions --search "cafe"   # full-text search on description; ignores --from/--to
```
Sample output:
```
ID                         Date        Category  CategoryID                 Description        Amount       Account  AccountID
─────────────────────────  ──────────  ────────  ─────────────────────────  ─────────────────  ───────────  ───────  ─────────────────────────
cmoz9cqg7000401rsrd4czgpq  2026-05-10  Café      cmmrq5pt7000401nzqeids2pe  Relax Cafe Bistro   -55,000.00  Cash     cmmrq5pvx002k01nz3r418p6r
```
Transaction IDs are 25-character CUIDs (e.g. `cmoz9cqg7000401rsrd4czgpq`). Expenses show as negative amounts.

### Monthly summary (income / expense / net / by-category)
```bash
pnpm wm summary
pnpm wm summary --year 2026 --month 3
```
Sample output:
```
May 2026
Income:   0.00
Expenses: 11,526,714.00
Net:      -11,526,714.00

Expenses by category:
  Entertainment        5,272,516.00
  Bills & Utilities    2,713,798.00
```

### Add a transaction
```bash
pnpm wm add <amount> <category-name> [--desc TEXT] [--details TEXT] [--date YYYY-MM-DD] [--account NAME_OR_ID]
```
- `<amount>` — positive number for both income and expenses (sign is determined by category type)
- `<category-name>` — must match exactly as shown in `wm categories` output (case-sensitive, including accents). Quote multi-word names: `"Food & Beverage"`. Single-word names don't need quotes: `Café`.
- `--desc` — short description / merchant name
- `--details` — additional notes (optional, separate from desc)
- `--date` — defaults to today if omitted
- `--account` — account name or ID; defaults to the default account if omitted

Examples:
```bash
pnpm wm add 50000 Café --desc "Lunch coffee"
pnpm wm add 1500000 Salary --date 2026-03-15
pnpm wm add 200000 "Food & Beverage" --account "Cash"
```

**Always run `pnpm wm categories --type expense` (or `--type income`) first** if you're not certain of the exact category name.

### Delete a transaction
```bash
pnpm wm delete <transaction-id>
```
Use the 25-character CUID from the ID column of `wm transactions` output.

### View categories
```bash
pnpm wm categories
pnpm wm categories --type expense
pnpm wm categories --type income
```
Sample output:
```
EXPENSE
  Café                   cmmrq5pt7000401nzqeids2pe
  Food & Beverage        cmmrnl5ik000801qs...
  Transportation         cmmrnl5ik000501qs...
```
Categories are **case-sensitive and accent-sensitive** — use the exact name shown. There are no aliases; "Transport" and "Transportation" are different categories.

### View budgets
```bash
pnpm wm budgets
```

### View exchange rates
```bash
pnpm wm exchange-rates
```

## Pitfalls

- **Command is `wm add`**, not `wm log` or `wm expense`.
- **Category names must match exactly** — always validate against `wm categories` output before calling `wm add`. "Food" ≠ "Food & Beverage"; "Cafe" ≠ "Café".
- **`--search` ignores `--from`/`--to`** — date filters have no effect when using `--search`.
- **`--desc` vs `--details`**: use `--desc` for the merchant/label (shown in the Description column); `--details` for supplementary notes.

## Workflow for common tasks

**"How much did I spend this month?"** → run `summary`, report totalExpense and byCategory breakdown.

**"Add an expense"** → run `categories --type expense` to get exact names, then run `add`.

**"What's my balance?"** → run `accounts` and report balances.

**"Show recent transactions"** → run `transactions --limit 20`.

**"Find transactions for X"** → run `transactions --search "X"`.

**"Am I over budget?"** → run `budgets` and compare amount vs spent.

Always confirm with the user before creating or deleting transactions.

---
name: wm
description: "Manage personal finances — query accounts, transactions, budgets, and add expenses using the Wealth Manager CLI"
user-invocable: true
metadata: {"openclaw": {"requires": {"bins": ["wm"]}, "emoji": "💰"}}
---

Use the `wm` CLI to answer questions about personal finances and handle expense tracking.

## Setup check

If `~/.wm/config.yml` is missing or the user hasn't configured the CLI, run:
```bash
wm config
```

## Available commands

### View accounts and balances
```bash
wm accounts
```

### View transactions
```bash
wm transactions
wm transactions --from 2026-03-01 --to 2026-03-31
wm transactions --limit 20
wm transactions --search "coffee"
```
- `--from` / `--to` — filter by date range (ignored when `--search` is used)
- `--limit` — max results, default 30, max 100
- `--search` — full-text search across description, details, category name, amount, and date

### Monthly summary (income / expenses / net / by category)
```bash
wm summary
wm summary --year 2026 --month 2
```

### Add a transaction
```bash
wm add <amount> "<category>" --desc "description" --date YYYY-MM-DD
wm add <amount> "<category>" --desc "Grocery run" --details "Milk x2, Eggs, Bread"
```
- `--desc` — short description/note
- `--details` — longer details such as item lists or receipt info (optional)

If the category name is unknown, run `wm categories` first to list options.

### Delete a transaction
```bash
wm delete <id>
```

### List categories
```bash
wm categories
wm categories --type expense
wm categories --type income
```

### View budgets
```bash
wm budgets
```

### View exchange rates
```bash
wm exchange-rates
```

## Common workflows

**"How much did I spend this month?"** → `wm summary`, report totalExpense and byCategory.

**"Add an expense"** → always run `wm categories --type expense` first to get valid category names, pick the best match, then `wm add` immediately without asking for confirmation.

**"What's my balance?"** → `wm accounts`, report balance per account.

**"Show recent transactions"** → `wm transactions --limit 20`.

**"Find a transaction"** → `wm transactions --search "<keyword>"`. Use the ID from results to delete if needed.

**"Am I over budget?"** → `wm budgets`, compare spent vs Budget columns.

## Transaction entry rules

- **Never ask for confirmation** before adding a transaction — just add it and report the result.
- **Know the category before adding** — if you already know the valid category name from earlier in the session, use it directly. Only run `wm categories --type expense` if you're unsure; don't fetch it every time.
- **Resolving uncertain categories** — if unsure which category fits a transaction, follow this escalation:
  1. Search existing transactions for similar merchants or descriptions: `wm transactions --search "<merchant or keyword>"`. Use the category from matching results.
  2. If still uncertain, use WebSearch to look up what the merchant/service is (e.g. "What type of business is X?") to determine the right category.
  3. Only after both steps fail to clarify should you fall back to the closest-matching category and note the assumption.
- **`--desc`** must be a short, human-readable summary of what the expense was (e.g. "Grocery run at Bách Hóa Xanh"). Keep it concise.
- **`--details`** is for structured info: item lists, invoice numbers, points used, etc. Format using markdown. Use literal inline newlines inside the quoted string (ANSI-C quoting or just embed real newlines). Example:
  ```bash
  wm add 95350 "Grocery" --desc "Grocery run" --details "* Táo gala túi 700gr: 59,900 VND
* Trứng gà hộp 10: 27,000 VND
* Cải thìa gói 300gr: 8,450 VND
* Invoice: OV207300603743447"
  ```

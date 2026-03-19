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
```

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

**"Am I over budget?"** → `wm budgets`, compare amount vs spent.

## Transaction entry rules

- **Never ask for confirmation** before adding a transaction — just add it and report the result.
- **Always fetch categories first** (`wm categories --type expense`) to find a valid category name before calling `wm add`. Never guess.
- **`--desc`** must be a short, human-readable summary of what the expense was (e.g. "Grocery run at Bách Hóa Xanh"). Keep it concise.
- **`--details`** is for structured info: item lists, invoice numbers, points used, etc. Format using markdown. Example:
  ```
  * Táo gala túi 700gr: 59,900 VND
  * Trứng gà hộp 10: 27,000 VND
  * Cải thìa gói 300gr: 8,450 VND
  * Invoice: OV207300603743447
  ```

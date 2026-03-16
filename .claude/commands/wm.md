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

### View transactions
```bash
pnpm wm transactions
pnpm wm transactions --from 2026-03-01 --to 2026-03-31
pnpm wm transactions --limit 10
```

### Monthly summary (income / expense / net / by-category)
```bash
pnpm wm summary
pnpm wm summary --year 2026 --month 3
```

### Add a transaction
```bash
pnpm wm add <amount> "<category-name>" --desc "description" --date YYYY-MM-DD
# Examples:
pnpm wm add 50000 "Food" --desc "Lunch"
pnpm wm add 1500000 "Salary" --date 2026-03-15
pnpm wm add 200000 "Transport" --account "Main Account"
```

### Delete a transaction
```bash
pnpm wm delete <transaction-id>
```

### View categories
```bash
pnpm wm categories
pnpm wm categories --type expense
pnpm wm categories --type income
```

### View budgets
```bash
pnpm wm budgets
```

### View exchange rates
```bash
pnpm wm exchange-rates
```

## Workflow for common tasks

**"How much did I spend this month?"** → run `summary`, report totalExpense and byCategory breakdown.

**"Add an expense"** → if category unclear, run `categories --type expense` first to show options, then run `add`.

**"What's my balance?"** → run `accounts` and report balances.

**"Show recent transactions"** → run `transactions --limit 20`.

**"Am I over budget?"** → run `budgets` and compare amount vs spent.

Always confirm with the user before creating or deleting transactions.

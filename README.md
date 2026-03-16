# Wealth Manager

Personal finance tracker with multi-account support, budgets, and currency conversion.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## CLI

The `wm` CLI lets you query and manage your finances from the terminal (or via Claude).

### Install

From the project root (one-time setup):

```bash
pnpm link --global
```

### Setup

Run the config wizard (one-time):

```bash
wm config
```

This saves your API key and base URL to `~/.wm/config.yml`. Generate an API key in the app under **Settings > API Keys**.

You can also override any value with environment variables:

```bash
export WM_API_KEY=wm_...
export WM_BASE_URL=https://your-deployed-app.com
```

### Usage

```bash
wm help                                      # show all commands

wm accounts                                  # list accounts
wm transactions                              # recent transactions
wm transactions --from 2026-03-01 --to 2026-03-31
wm summary                                   # this month's income / expenses
wm summary --year 2026 --month 2

wm add 50000 "Food" --desc "Lunch"           # add an expense
wm add 1500000 "Salary" --date 2026-03-15    # add income with a specific date
wm delete <id>                               # delete a transaction

wm categories                                # list categories
wm budgets                                   # list budgets with progress
wm exchange-rates                            # list exchange rates
```

### Claude skill

With the CLI installed, use `/wm` in Claude Code to let Claude answer finance questions and add transactions on your behalf.

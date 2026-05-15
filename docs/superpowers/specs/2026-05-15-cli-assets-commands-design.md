# CLI Assets Commands Design

**Date:** 2026-05-15  
**Status:** Approved

## Goal

Add full asset CRUD + price-refresh operations to the `wm` CLI so an agent (or user) can do everything with assets that is possible via the UI.

## Commands

All asset operations live under the `assets` subcommand namespace.

### List
```
wm assets
wm assets --json
```
Lists all assets for the authenticated user. With `--json`, prints raw API response.

### Add
```
wm assets add <name> <type> <value> [options]

Options:
  --currency USD|VND     Default: USD
  --ticker SYMBOL        Required when type=stock
  --quantity N           Required when type=stock or type=gold
```
Valid types: `real_estate`, `stock`, `bond`, `gold`

### Update
```
wm assets update <id> [options]

Options:
  --name TEXT
  --value N
  --currency USD|VND
  --ticker SYMBOL
  --quantity N
```
Sends only the fields that are provided. At least one field must be given.

### Delete
```
wm assets delete <id>
```
Deletes the asset with the given ID.

### Refresh Price
```
wm assets refresh <id>
```
Triggers a server-side price refresh for the asset. Only supported for `stock` and `gold` types. Prints the updated value on success.

## List Output Format

Table with columns: ID, Name, Type, Currency, Value (right-aligned), Quantity, Ticker, Last Priced.  
Missing optional fields (quantity, ticker, lastPricedAt) are shown as `—`.

```
ID        Name          Type         Currency  Value        Quantity  Ticker  Last Priced
────────  ────────────  ───────────  ────────  ───────────  ────────  ──────  ──────────
abc123    Apple Stock   stock        USD       15,000.00    10        AAPL    2026-05-14
def456    House         real_estate  VND       2,000,000    —         —       —
```

## Router Change

The existing `commands` map handles top-level commands. Asset subcommand dispatch is added as a special case: when `command === "assets"`, the router reads `args[1]` and calls the appropriate handler (`list`, `add`, `update`, `delete`, `refresh`). If `args[1]` is absent or unrecognized, it defaults to listing. All existing commands are unaffected.

## Error Handling

- Missing required args: print usage hint and `process.exit(1)` — consistent with existing `add`/`delete` commands.
- API errors: caught by the existing `axios` error handler in `main()`.
- `refresh` on unsupported asset types: the API returns a 400; the CLI surfaces the error message.

## Files to Change

- `cli/index.ts` — add `assetsCommand()` function and wire into router.

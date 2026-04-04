#!/usr/bin/env tsx
/**
 * Wealth Manager CLI
 *
 * Usage: wm <command> [options]
 *
 * Config: ~/.wm/config.yml  (or env vars WM_API_KEY / WM_BASE_URL)
 */

import axios from "axios";
import https from "https";
import fs from "fs";
import { resolvedConfig, configCommand } from "./config.js";

function systemCaAgent(): https.Agent | undefined {
  const candidates = [
    "/etc/ssl/certs/ca-certificates.crt", // Debian/Ubuntu
    "/etc/pki/tls/certs/ca-bundle.crt",   // RHEL/CentOS
    "/etc/ssl/ca-bundle.pem",             // OpenSUSE
    "/etc/ssl/cert.pem",                  // macOS/Alpine
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return new https.Agent({ ca: fs.readFileSync(p) });
  }
}

// Initialized in main() after config is resolved
let http = axios.create();

// ── Arg helpers ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function positional(index: number): string | undefined {
  const flagPositions = new Set<number>();
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) flagPositions.add(i + 1);
  }
  const positionals = args.filter((a, i) => !a.startsWith("--") && !flagPositions.has(i));
  return positionals[index];
}

function pp(data: unknown) {
  console.log(JSON.stringify(data, (key, value) => {
    if (key === "icon" && typeof value === "string" && value.startsWith("data:")) return undefined;
    return value;
  }, 2));
}

// ── Commands ────────────────────────────────────────────────────────────────

async function accounts() {
  const { data } = await http.get("/api/accounts");
  pp(data);
}

async function transactions() {
  const params: Record<string, string | number> = {};
  const from = flag("from");
  const to = flag("to");
  const limit = flag("limit");
  const accountId = flag("account");
  const categoryId = flag("category");
  if (from) params.startDate = from;
  if (to) params.endDate = to;
  if (limit) params.limit = Number(limit);
  if (accountId) params.accountId = accountId;
  if (categoryId) params.categoryId = categoryId;
  const { data } = await http.get("/api/transactions", { params });
  pp(data);
}

async function categories() {
  const type = flag("type");
  const params = type ? { type } : {};
  const { data } = await http.get("/api/transaction-categories", { params });
  pp(data);
}

async function budgets() {
  const { data } = await http.get("/api/budgets");
  pp(data);
}

async function exchangeRates() {
  const { data } = await http.get("/api/exchange-rates");
  pp(data);
}

async function summary() {
  const now = new Date();
  const year = Number(flag("year") ?? now.getFullYear());
  const month = Number(flag("month") ?? now.getMonth() + 1);
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59).toISOString();
  const { data } = await http.get("/api/transactions/summary", {
    params: { startDate: start, endDate: end },
  });
  pp(data);
}

async function add() {
  const amountStr = positional(1);
  const categoryName = positional(2);

  if (!amountStr || !categoryName) {
    console.error("Usage: wm add <amount> <category-name> [--desc TEXT] [--details TEXT] [--date YYYY-MM-DD] [--account NAME_OR_ID]");
    process.exit(1);
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    console.error(`Invalid amount: ${amountStr}`);
    process.exit(1);
  }

  const { data: cats } = await http.get("/api/transaction-categories");
  const cat =
    cats.find((c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase()) ??
    cats.find((c: { name: string }) => c.name.toLowerCase().includes(categoryName.toLowerCase()));
  if (!cat) {
    console.error(`Category not found: "${categoryName}"`);
    console.error("Available categories:", cats.map((c: { name: string }) => c.name).join(", "));
    process.exit(1);
  }

  const accountArg = flag("account");
  let accountId: string;
  const { data: accs } = await http.get("/api/accounts");
  if (accountArg) {
    const acc = accs.find(
      (a: { id: string; name: string }) =>
        a.id === accountArg ||
        a.name.toLowerCase() === accountArg.toLowerCase() ||
        a.name.toLowerCase().includes(accountArg.toLowerCase())
    );
    if (!acc) {
      console.error(`Account not found: "${accountArg}"`);
      console.error("Available accounts:", accs.map((a: { name: string }) => a.name).join(", "));
      process.exit(1);
    }
    accountId = acc.id;
  } else {
    const defaultAcc = accs.find((a: { isDefault: boolean }) => a.isDefault) ?? accs[0];
    if (!defaultAcc) {
      console.error("No accounts found. Create an account in the app first.");
      process.exit(1);
    }
    accountId = defaultAcc.id;
  }

  const date = flag("date") ? new Date(flag("date")!).toISOString() : new Date().toISOString();
  const description = flag("desc");
  const details = flag("details");

  const { data } = await http.post("/api/transactions", {
    amount,
    date,
    description,
    details,
    accountId,
    categoryId: cat.id,
  });

  console.log("Transaction created:");
  pp(data);
}

async function deleteTransaction() {
  const id = positional(1);
  if (!id) {
    console.error("Usage: wm delete <transaction-id>");
    process.exit(1);
  }
  await http.delete(`/api/transactions/${id}`);
  console.log(`Transaction ${id} deleted.`);
}

function help() {
  console.log(`
Wealth Manager CLI

Usage: wm <command> [options]

Commands:
  config                                Set API key and base URL
  accounts                              List all accounts
  transactions                          List transactions
    --from DATE   Start date (YYYY-MM-DD)
    --to DATE     End date (YYYY-MM-DD)
    --limit N     Max results (default 50)
    --account ID  Filter by account ID
    --category ID Filter by category ID
  add <amount> <category>               Create a transaction
    --desc TEXT     Description
    --details TEXT  Item list or extra details (multiline supported)
    --date DATE     Date (YYYY-MM-DD, default today)
    --account NAME_OR_ID  Account (default: default account)
  delete <id>                           Delete a transaction
  categories                            List categories
    --type TYPE   Filter: income|expense
  budgets                               List budgets
  summary                               Monthly financial summary
    --year YEAR   Year (default: current)
    --month MONTH Month 1-12 (default: current)
  exchange-rates                        List exchange rates

Config: ~/.wm/config.yml  (env vars WM_API_KEY / WM_BASE_URL take precedence)
`);
}

// ── Router ──────────────────────────────────────────────────────────────────

async function main() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    help();
    return;
  }

  if (command === "config") {
    await configCommand();
    return;
  }

  const { apiKey, baseUrl } = resolvedConfig();

  if (!apiKey) {
    console.error("No API key found. Run `wm config` to set one.");
    process.exit(1);
  }

  http = axios.create({ baseURL: baseUrl, headers: { Authorization: `Bearer ${apiKey}` }, httpsAgent: systemCaAgent() });

  const commands: Record<string, () => Promise<void> | void> = {
    accounts,
    transactions,
    add,
    delete: deleteTransaction,
    categories,
    budgets,
    summary,
    "exchange-rates": exchangeRates,
    help,
  };

  const fn = commands[command];
  if (!fn) {
    console.error(`Unknown command: ${command}`);
    help();
    process.exit(1);
  }
  await fn();
}

main().catch((err) => {
  if (axios.isAxiosError(err)) {
    console.error(`API error ${err.response?.status}:`, err.response?.data ?? err.message);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

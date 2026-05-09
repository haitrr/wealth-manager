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
const jsonOutput = args.includes("--json");

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

function printJson(data: unknown) {
  console.log(JSON.stringify(data, (key, value) => {
    if (key === "icon" && typeof value === "string" && value.startsWith("data:")) return undefined;
    return value;
  }, 2));
}

// ── Table formatter ─────────────────────────────────────────────────────────

function table(headers: string[], rows: string[][], opts?: { align?: ("left" | "right")[] }) {
  const cols = headers.length;
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] ?? "").length)));
  const align = opts?.align ?? headers.map(() => "left" as const);

  const pad = (s: string, w: number, a: "left" | "right") =>
    a === "right" ? s.padStart(w) : s.padEnd(w);

  const sep = widths.map(w => "─".repeat(w)).join("  ");
  const header = headers.map((h, i) => pad(h, widths[i], "left")).join("  ");

  console.log(header);
  console.log(sep);
  for (const row of rows) {
    console.log(Array.from({ length: cols }, (_, i) => pad(row[i] ?? "", widths[i], align[i])).join("  "));
  }
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(iso: string): string {
  return iso.split("T")[0];
}

// ── Commands ────────────────────────────────────────────────────────────────

async function accounts() {
  const { data } = await http.get("/api/accounts");
  if (jsonOutput) { printJson(data); return; }

  const rows = data.map((a: { id: string; name: string; currency: string; balance: number; isDefault: boolean }) => [
    a.id,
    a.name,
    a.currency,
    fmt(a.balance),
    a.isDefault ? "✓" : "",
  ]);
  table(["ID", "Name", "Currency", "Balance", "Default"], rows, { align: ["left", "left", "left", "right", "left"] });
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
  const { data: res } = await http.get("/api/transactions", { params });
  const data = Array.isArray(res) ? res : (res.data ?? res);
  if (jsonOutput) { printJson(data); return; }

  const rows = data.map((t: {
    id: string; date: string; description?: string; category?: { name: string; type: string };
    amount: number; account?: { name: string }
  }) => [
    t.id,
    fmtDate(t.date),
    t.category?.name ?? "",
    t.description ?? "",
    (t.category?.type === "income" ? "+" : "-") + fmt(t.amount),
    t.account?.name ?? "",
  ]);
  table(["ID", "Date", "Category", "Description", "Amount", "Account"], rows, {
    align: ["left", "left", "left", "left", "right", "left"],
  });
  console.log(`\n${data.length} transaction(s)`);
}

async function categories() {
  const type = flag("type");
  const params = type ? { type } : {};
  const { data } = await http.get("/api/transaction-categories", { params });
  if (jsonOutput) { printJson(data); return; }

  const grouped: Record<string, { id: string; name: string }[]> = {};
  for (const c of data as { id: string; name: string; type: string }[]) {
    (grouped[c.type] ??= []).push({ id: c.id, name: c.name });
  }
  for (const [t, items] of Object.entries(grouped)) {
    console.log(`\n${t.toUpperCase()}`);
    const maxName = Math.max(...items.map(c => c.name.length));
    for (const c of items) console.log(`  ${c.name.padEnd(maxName)}  ${c.id}`);
  }
}

async function budgets() {
  const { data } = await http.get("/api/budgets");
  if (jsonOutput) { printJson(data); return; }

  const rows = data.map((b: {
    id: string; name: string; currency: string; spent: number; amount: number;
    percentUsed: number; period: string; daysRemaining: number
  }) => [
    b.id,
    b.name,
    b.currency,
    fmt(b.spent),
    fmt(b.amount),
    `${(b.percentUsed ?? 0).toFixed(1)}%`,
    b.period,
  ]);
  table(["ID", "Name", "Currency", "Spent", "Budget", "Used", "Period"], rows, {
    align: ["left", "left", "left", "right", "right", "right", "left"],
  });
}

async function exchangeRates() {
  const { data } = await http.get("/api/exchange-rates");
  if (jsonOutput) { printJson(data); return; }

  const rows = data.map((r: { fromCurrency: string; toCurrency: string; rate: number }) => [
    r.fromCurrency,
    r.toCurrency,
    fmt(r.rate, 4),
  ]);
  table(["From", "To", "Rate"], rows, { align: ["left", "left", "right"] });
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
  if (jsonOutput) { printJson(data); return; }

  console.log(`\n${data.month}`);
  console.log(`Income:   ${fmt(data.totalIncome)}`);
  console.log(`Expenses: ${fmt(data.totalExpenses)}`);
  console.log(`Net:      ${fmt(data.netBalance)}`);

  if (data.incomeByCategory?.length) {
    console.log("\nIncome by category:");
    const sorted = [...data.incomeByCategory].sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);
    for (const c of sorted as { name: string; amount: number }[]) {
      console.log(`  ${c.name.padEnd(20)} ${fmt(c.amount).padStart(12)}`);
    }
  }

  if (data.expensesByCategory?.length) {
    console.log("\nExpenses by category:");
    const sorted = [...data.expensesByCategory].sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);
    for (const c of sorted as { name: string; amount: number }[]) {
      console.log(`  ${c.name.padEnd(20)} ${fmt(c.amount).padStart(12)}`);
    }
  }
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

  if (jsonOutput) { printJson(data); return; }

  const accName = accs.find((a: { id: string; name: string }) => a.id === accountId)?.name ?? accountId;
  const sign = cat.type === "income" ? "+" : "-";
  const desc = description ? ` — ${description}` : "";
  console.log(`Added: ${sign}${fmt(amount)} ${cat.name}${desc} (${fmtDate(data.date)}, ${accName})`);
}

async function deleteTransaction() {
  const id = positional(1);
  if (!id) {
    console.error("Usage: wm delete <transaction-id>");
    process.exit(1);
  }
  await http.delete(`/api/transactions/${id}`);
  console.log(`Deleted transaction ${id}.`);
}

function help() {
  console.log(`
Wealth Manager CLI

Usage: wm <command> [options] [--json]

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

Options:
  --json        Output raw JSON instead of human-readable format

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

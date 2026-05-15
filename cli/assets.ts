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

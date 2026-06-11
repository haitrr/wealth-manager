"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Asset, AssetPayload, AssetType } from "@/lib/api/assets";
import { Currency, getAccounts, Account } from "@/lib/api/accounts";

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "stock", label: "Stock" },
  { value: "bond", label: "Bond" },
  { value: "gold", label: "Gold" },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "VND", label: "VND" },
];

function NativeSelect({ id, name, value, options, onChange, required }: {
  id: string; name: string; value: string; required?: boolean;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      required={required}
      onChange={e => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function AccountSelect({ id, name, value, accounts, onChange, required, placeholder }: {
  id: string; name: string; value: string; required?: boolean; placeholder?: string;
  accounts: Account[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      required={required}
      onChange={e => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {accounts.map(a => (
        <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
      ))}
    </select>
  );
}

function PurchaseSection({ accounts, purchaseAccountId, defaultPurchaseAccountId, onChange, asset }: {
  accounts: Account[];
  purchaseAccountId: string;
  defaultPurchaseAccountId: string;
  onChange: (v: string) => void;
  asset?: Asset | null;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-3">
      <p className="text-sm font-medium">Purchase</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Date</Label>
          <Input id="purchaseDate"
name="purchaseDate"
type="date"
className="text-[16px] md:text-sm"
            defaultValue={asset?.purchaseDate?.slice(0, 10) ?? ""}
required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Price</Label>
          <Input id="purchasePrice"
name="purchasePrice"
type="number"
step="any"
min="0"
            defaultValue={asset?.purchasePrice ?? ""}
required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchaseAccountId">Debit Account</Label>
        <AccountSelect id="purchaseAccountId"
name="purchaseAccountId"
          value={purchaseAccountId || defaultPurchaseAccountId}
          accounts={accounts}
onChange={onChange}
required />
      </div>
    </div>
  );
}

function SellSection({ accounts, sellAccountId, onChange, onRemove, asset }: {
  accounts: Account[];
  sellAccountId: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  asset?: Asset | null;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Sale</p>
        <Button type="button"
variant="ghost"
size="sm"
className="text-muted-foreground h-auto py-0"
          onClick={onRemove}>Remove</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sellDate">Date</Label>
          <Input id="sellDate"
name="sellDate"
type="date"
className="text-[16px] md:text-sm"
            defaultValue={asset?.sellDate?.slice(0, 10) ?? ""}
required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellPrice">Price</Label>
          <Input id="sellPrice"
name="sellPrice"
type="number"
step="any"
min="0"
            defaultValue={asset?.sellPrice ?? ""}
required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sellAccountId">Credit Account</Label>
        <AccountSelect id="sellAccountId"
name="sellAccountId"
value={sellAccountId}
          accounts={accounts}
onChange={onChange}
placeholder="Select account…"
required />
      </div>
    </div>
  );
}

interface AssetFormProps {
  open: boolean;
  asset?: Asset | null;
  onClose: () => void;
  onSubmit: (payload: AssetPayload) => Promise<void>;
  onDelete?: (asset: Asset) => Promise<void>;
}

export function AssetForm({ open, asset, onClose, onSubmit, onDelete }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [type, setType] = useState<AssetType>(asset?.type ?? "stock");
  const [currency, setCurrency] = useState<Currency>(asset?.currency ?? "USD");
  const [purchaseAccountId, setPurchaseAccountId] = useState(asset?.purchaseTransactionId ? "" : "");
  const [sellAccountId, setSellAccountId] = useState("");
  const [showSell, setShowSell] = useState(!!(asset?.sellDate));

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
    enabled: open,
  });

  // Pre-select account when editing
  const defaultPurchaseAccountId = purchaseAccountId || (accounts[0]?.id ?? "");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";

    const metadata: Record<string, unknown> = {};
    if (type === "real_estate") {
      metadata.address = get("address");
    } else if (type === "stock") {
      metadata.exchange = get("exchange");
    } else if (type === "bond") {
      metadata.issuer = get("issuer");
      metadata.interestRate = get("interestRate") ? Number(get("interestRate")) : undefined;
      metadata.maturityDate = get("maturityDate") || undefined;
    } else if (type === "gold") {
      metadata.form = get("goldForm");
    }

    const payload: AssetPayload = {
      name: get("name"),
      type,
      currency,
      currentValue: Number(get("currentValue")),
      quantity: get("quantity") ? Number(get("quantity")) : null,
      ticker: get("ticker") || null,
      purchaseDate: get("purchaseDate"),
      purchasePrice: Number(get("purchasePrice")),
      purchaseAccountId: get("purchaseAccountId"),
      sellDate: showSell ? (get("sellDate") || null) : null,
      sellPrice: showSell && get("sellPrice") ? Number(get("sellPrice")) : null,
      sellAccountId: showSell ? (get("sellAccountId") || null) : null,
      metadata,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const meta = asset?.metadata as Record<string, unknown> | undefined;

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "Add Asset"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2" key={asset?.id ?? "new"}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Apple shares" defaultValue={asset?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" value={type} onChange={v => setType(v as AssetType)} options={ASSET_TYPE_OPTIONS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <NativeSelect id="currency" name="currency" value={currency} onChange={v => setCurrency(v as Currency)} options={CURRENCY_OPTIONS} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentValue">Current Value</Label>
            <Input id="currentValue"
name="currentValue"
type="number"
step="any"
min="0"
              defaultValue={asset?.currentValue ?? ""}
required />
          </div>

          {(type === "stock" || type === "gold") && (
            <div className="space-y-2">
              <Label htmlFor="quantity">{type === "gold" ? "Quantity (oz)" : "Shares"}</Label>
              <Input id="quantity"
name="quantity"
type="number"
step="any"
min="0"
                defaultValue={asset?.quantity ?? ""}
required />
            </div>
          )}

          {type === "stock" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker</Label>
                <Input id="ticker" name="ticker" placeholder="e.g. AAPL" defaultValue={asset?.ticker ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange</Label>
                <Input id="exchange" name="exchange" placeholder="e.g. NASDAQ" defaultValue={meta?.exchange as string ?? ""} />
              </div>
            </div>
          )}

          {type === "real_estate" && (
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="e.g. 123 Main St" defaultValue={meta?.address as string ?? ""} />
            </div>
          )}

          {type === "bond" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input id="issuer" name="issuer" placeholder="e.g. US Treasury" defaultValue={meta?.issuer as string ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate"
name="interestRate"
type="number"
step="0.01"
min="0"
                    defaultValue={meta?.interestRate as number ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maturityDate">Maturity Date</Label>
                  <Input id="maturityDate"
name="maturityDate"
type="date"
                    defaultValue={meta?.maturityDate as string ?? ""} />
                </div>
              </div>
            </>
          )}

          {type === "gold" && (
            <div className="space-y-2">
              <Label htmlFor="goldForm">Form</Label>
              <select id="goldForm"
name="goldForm"
defaultValue={meta?.form as string ?? "physical"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="physical">Physical</option>
                <option value="ETF">ETF</option>
              </select>
            </div>
          )}

          <PurchaseSection
            accounts={accounts}
            purchaseAccountId={purchaseAccountId}
            defaultPurchaseAccountId={defaultPurchaseAccountId}
            onChange={setPurchaseAccountId}
            asset={asset}
          />

          {!showSell ? (
            <Button type="button" variant="outline" className="w-full" onClick={() => setShowSell(true)}>
              Mark as Sold
            </Button>
          ) : (
            <SellSection
              accounts={accounts}
              sellAccountId={sellAccountId}
              onChange={setSellAccountId}
              onRemove={() => setShowSell(false)}
              asset={asset}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {asset && onDelete && (
                confirmDelete
                  ? <p className="text-sm text-destructive">Delete this asset?</p>
                  : <Button type="button"
variant="outline"
                      className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive"
                      onClick={() => setConfirmDelete(true)}
disabled={loading}>
                      <Trash2 className="size-4 mr-1" />Delete
                    </Button>
              )}
            </div>
            <div className="flex gap-2">
              {confirmDelete ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button type="button"
variant="destructive"
disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try { await onDelete?.(asset!); onClose(); }
                      finally { setLoading(false); }
                    }}>
                    {loading ? "Deleting…" : "Confirm Delete"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Saving…" : asset ? "Save Changes" : "Add Asset"}</Button>
                </>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

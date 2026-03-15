"use client";

import { useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Account, Currency } from "@/lib/api/accounts";

interface AccountFormProps {
  open: boolean;
  account?: Account | null;
  onClose: () => void;
  onSubmit: (data: { name: string; balance: number; currency: Currency }) => Promise<void>;
  onDelete?: (account: Account) => void;
}

function CurrencySelect({ value, onChange }: { value: Currency; onChange: (value: Currency) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Currency)}>
      <SelectTrigger id="currency">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USD">USD ($)</SelectItem>
        <SelectItem value="VND">VND (₫)</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function AccountForm({ open, account, onClose, onSubmit, onDelete }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? "USD");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmDelete(false);
      setError("");
      setCurrency(account?.currency ?? "USD");
    }
  }, [open, account]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const balance = parseFloat((form.elements.namedItem("balance") as HTMLInputElement).value) || 0;

    try {
      await onSubmit({ name, balance, currency });
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Savings, Checking"
                defaultValue={account?.name ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Balance</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                defaultValue={account?.balance ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelect value={currency} onChange={setCurrency} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="-mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4">
            {account && onDelete && confirmDelete ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-destructive">Delete this account?</span>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(account); onClose(); }}>
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  {account && onDelete && (
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} disabled={loading}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : account ? "Save Changes" : "Add Account"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

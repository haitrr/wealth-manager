"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, Tag, User, DollarSign, Upload, Landmark, PiggyBank, Building2, HandCoins } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImportDialog } from "@/components/transactions/import-dialog";
import { getSettings, updateSettings } from "@/lib/api/settings";
import { Currency } from "@/lib/api/accounts";

const SETTINGS_ITEMS = [
  { href: "/budgets", label: "Budgets", description: "Set and track spending budgets", icon: PiggyBank },
  { href: "/assets", label: "Assets", description: "Manage real estate, stocks, gold", icon: Building2 },
  { href: "/loans", label: "Loans", description: "Track borrowed and lent money", icon: HandCoins },
  { href: "/settings/account", label: "User", description: "Manage password and logout", icon: User },
  { href: "/settings/accounts", label: "Accounts", description: "Manage your bank accounts", icon: CreditCard },
  { href: "/settings/categories", label: "Categories", description: "Manage transaction categories", icon: Tag },
  { href: "/settings/exchange-rates", label: "Currency", description: "Manage exchange rates", icon: DollarSign },
  { href: "/settings/loan-categories", label: "Loan Defaults", description: "Default categories for loan payments", icon: Landmark },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "VND", label: "VND — Vietnamese Dong" },
];

export default function SettingsPage() {
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Display Currency</p>
          <p className="text-xs text-muted-foreground">All summaries are converted to this currency</p>
        </div>
        <select
          className="text-sm border rounded-md px-2 py-1.5 bg-background"
          value={settings?.defaultCurrency ?? "USD"}
          onChange={e => updateMutation.mutate({ defaultCurrency: e.target.value as Currency })}
        >
          {CURRENCIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="divide-y rounded-lg border overflow-hidden">
        {SETTINGS_ITEMS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-4 py-4 hover:bg-accent transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Icon className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
        <button
          onClick={() => setImportOpen(true)}
          className="flex w-full items-center gap-4 px-4 py-4 hover:bg-accent transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Upload className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sm">Import</p>
            <p className="text-xs text-muted-foreground">Import transactions from a file</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </main>

  );
}

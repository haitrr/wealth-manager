"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, Tag, User, DollarSign, Upload, Landmark, PiggyBank, Building2, HandCoins, Link2 } from "lucide-react";
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

const CURRENCIES: Currency[] = ["USD", "VND"];

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
      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium mb-0.5">Display Currency</p>
        <p className="text-xs text-muted-foreground mb-3">All summaries are converted to this currency</p>
        <div className="flex rounded-lg border overflow-hidden">
          {CURRENCIES.map(c => {
            const active = (settings?.defaultCurrency ?? "USD") === c;
            return (
              <button
                key={c}
                onClick={() => updateMutation.mutate({ defaultCurrency: c })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium mb-0.5">Timezone</p>
        <p className="text-xs text-muted-foreground mb-3">Used to interpret dates you enter</p>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-[16px] md:text-sm"
          value={settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={(e) => updateMutation.mutate({ timezone: e.target.value })}
        >
          {Intl.supportedValuesOf("timeZone").map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium mb-0.5 flex items-center gap-2">
          <Link2 className="size-4" />
          OpenTimeline
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Connect your OpenTimeline instance to auto-suggest locations on transactions
        </p>
        <input
          type="url"
          placeholder="http://localhost:3000"
          defaultValue={settings?.openTimelineUrl ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-[16px] md:text-sm"
          onBlur={(e) => {
            const val = e.target.value.trim();
            updateMutation.mutate({ openTimelineUrl: val || null });
          }}
        />
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

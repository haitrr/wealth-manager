"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, Tag, User, DollarSign, Upload } from "lucide-react";
import { ImportDialog } from "@/components/transactions/import-dialog";

const SETTINGS_ITEMS = [
  { href: "/settings/account", label: "User", description: "Manage password and logout", icon: User },
  { href: "/settings/accounts", label: "Accounts", description: "Manage your bank accounts", icon: CreditCard },
  { href: "/settings/categories", label: "Categories", description: "Manage transaction categories", icon: Tag },
  { href: "/settings/exchange-rates", label: "Currency", description: "Manage exchange rates", icon: DollarSign },
];

export default function SettingsPage() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
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

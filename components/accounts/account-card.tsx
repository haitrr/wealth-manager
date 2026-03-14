"use client";

import { Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Account } from "@/lib/api/accounts";

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onSetDefault: (account: Account) => void;
}

export function AccountCard({ account, onEdit, onDelete, onSetDefault }: AccountCardProps) {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(account.balance);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{account.name}</p>
            {account.isDefault && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{formattedBalance}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!account.isDefault && (
            <Button
              variant="ghost"
              size="icon"
              title="Set as default"
              onClick={() => onSetDefault(account)}
            >
              <Star className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(account)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(account)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

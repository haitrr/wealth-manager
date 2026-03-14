"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/lib/api/transactions";
import { CategoryType } from "@/lib/api/transaction-categories";
import { formatCurrency } from "@/lib/utils";

const TYPE_COLORS: Record<CategoryType, string> = {
  income: "text-green-600 dark:text-green-400",
  expense: "text-red-600 dark:text-red-400",
  payable: "text-amber-600 dark:text-amber-400",
  receivable: "text-blue-600 dark:text-blue-400",
};

const TYPE_SIGN: Record<CategoryType, string> = {
  income: "+",
  expense: "-",
  payable: "-",
  receivable: "+",
};

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, onEdit, onDelete }: TransactionRowProps) {
  const type = transaction.category.type;
  const formattedAmount = formatCurrency(Math.abs(transaction.amount), transaction.account.currency);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(transaction.date));

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">
            {transaction.description || transaction.category.name}
          </p>
          {transaction.description && (
            <span className="text-xs text-muted-foreground shrink-0">
              {transaction.category.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          <span className="text-xs text-muted-foreground">·</span>
          <p className="text-xs text-muted-foreground">{transaction.account.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-semibold text-sm ${TYPE_COLORS[type]}`}>
          {TYPE_SIGN[type]}
          {formattedAmount}
        </span>
        <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(transaction)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(transaction)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

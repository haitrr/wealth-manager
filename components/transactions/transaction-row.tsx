"use client";

import { Transaction } from "@/lib/api/transactions";
import { CategoryType } from "@/lib/api/transaction-categories";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/components/transaction-categories/category-icon";

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
}

export function TransactionRow({ transaction, onEdit }: TransactionRowProps) {
  const type = transaction.category.type;
  const formattedAmount = formatCurrency(Math.abs(transaction.amount), transaction.account.currency);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(transaction.date));

  return (
    <button
      type="button"
      onClick={() => onEdit(transaction)}
      className="flex w-full items-center justify-between gap-4 px-3 py-3 border-b last:border-0 text-left hover:bg-muted/50 transition-colors rounded"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <CategoryIcon icon={transaction.category.icon} size={36} />
        <div className="min-w-0">
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
      </div>

      <span className={`font-semibold text-sm shrink-0 ${TYPE_COLORS[type]}`}>
        {TYPE_SIGN[type]}
        {formattedAmount}
      </span>
    </button>
  );
}

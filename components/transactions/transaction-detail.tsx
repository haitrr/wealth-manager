"use client";

import { ExternalLink, Pencil, X } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryIcon } from "@/components/transaction-categories/category-icon";
import { Transaction } from "@/lib/api/transactions";
import { CategoryType } from "@/lib/api/transaction-categories";
import { formatCurrency } from "@/lib/utils";

const TYPE_COLORS: Record<CategoryType, string> = {
  income: "text-green-600 dark:text-green-400",
  expense: "text-red-600 dark:text-red-400",
};

const TYPE_SIGN: Record<CategoryType, string> = {
  income: "+",
  expense: "-",
};

interface TransactionDetailProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionDetail({
  open,
  transaction,
  onClose,
  onEdit,
}: TransactionDetailProps) {
  if (!transaction) return null;

  const type = transaction.category.type;
  const formattedAmount = formatCurrency(Math.abs(transaction.amount), transaction.account.currency);

  const loanPaymentInfo = transaction.loanPaymentPrincipal
    ? { loan: transaction.loanPaymentPrincipal.loan, role: "Principal" }
    : transaction.loanPaymentInterest
    ? { loan: transaction.loanPaymentInterest.loan, role: "Interest" }
    : transaction.loanPaymentPrepayFee
    ? { loan: transaction.loanPaymentPrepayFee.loan, role: "Prepay Fee" }
    : null;
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(transaction.date));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg flex flex-col max-h-[90dvh]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2 overflow-y-auto min-h-0">
          <div className="flex items-center gap-4">
            <CategoryIcon icon={transaction.category.icon} size={52} />
            <div>
              <p className="font-semibold text-base">
                {transaction.description || transaction.category.name}
              </p>
              {transaction.description && (
                <p className="text-sm text-muted-foreground">{transaction.category.name}</p>
              )}
            </div>
          </div>

          <div className={`text-3xl font-bold ${TYPE_COLORS[type]}`}>
            {TYPE_SIGN[type]}{formattedAmount}
          </div>

          <div className="space-y-3 text-sm">
            {loanPaymentInfo && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-0.5 text-xs font-medium">
                  Loan Payment · {loanPaymentInfo.role}
                </span>
                <span className="text-muted-foreground text-xs">{loanPaymentInfo.loan.name}</span>
              </div>
            )}
            <Row label="Date" value={formattedDate} />
            <Row label="Account" value={transaction.account.name} />
            {transaction.details && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Details</span>
                <span className="whitespace-pre-wrap">{transaction.details.replace(/\\n/g, '\n')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 h-10 text-base" onClick={onClose}>
            <X className="size-4 mr-2" />
            Close
          </Button>
          {loanPaymentInfo ? (
            <Link
              href={`/loans/${loanPaymentInfo.loan.id}`}
              className={buttonVariants({ className: "flex-1 h-10 text-base" })}
            >
              <ExternalLink className="size-4 mr-2" />
              View Loan
            </Link>
          ) : (
            <Button className="flex-1 h-10 text-base" onClick={() => onEdit(transaction)}>
              <Pencil className="size-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getLoans } from "@/lib/api/loans";
import { Currency } from "@/lib/api/accounts";
import { ExchangeRate } from "@/lib/api/exchange-rates";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

function convertAmount(amount: number, fromCurrency: Currency, toCurrency: Currency, exchangeRates: ExchangeRate[]) {
  if (fromCurrency === toCurrency) return amount;
  const directRate = exchangeRates.find(
    (rate) => rate.fromCurrency === fromCurrency && rate.toCurrency === toCurrency
  );
  if (directRate) return amount * directRate.rate;

  const inverseRate = exchangeRates.find(
    (rate) => rate.fromCurrency === toCurrency && rate.toCurrency === fromCurrency
  );
  if (inverseRate) return amount / inverseRate.rate;

  return amount;
}

export function LoanOverview({ currency, exchangeRates }: { currency: Currency; exchangeRates: ExchangeRate[] }) {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  });

  if (isLoading) return null;

  const activeLoans = loans.filter((loan) => loan.status !== "closed");
  if (activeLoans.length === 0) return null;

  const loansWithDisplayBalance = activeLoans.map((loan) => ({
    loan,
    displayRemainingPrincipal: convertAmount(loan.remainingPrincipal, loan.currency, currency, exchangeRates),
  }));
  const borrowed = activeLoans.filter((loan) => loan.direction === "borrowed");
  const lent = activeLoans.filter((loan) => loan.direction === "lent");
  const topLoans = [...loansWithDisplayBalance]
    .sort((left, right) => right.displayRemainingPrincipal - left.displayRemainingPrincipal)
    .slice(0, 4);

  const totalBorrowed = borrowed.reduce(
    (sum, loan) => sum + convertAmount(loan.remainingPrincipal, loan.currency, currency, exchangeRates),
    0
  );
  const totalLent = lent.reduce(
    (sum, loan) => sum + convertAmount(loan.remainingPrincipal, loan.currency, currency, exchangeRates),
    0
  );

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Loans</p>
          <Link href="/loans" className="text-xs text-primary">View all</Link>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-muted-foreground">Borrowed</p>
            <p className="mt-1 text-sm font-semibold">
              {borrowed.length > 0 ? formatCurrency(totalBorrowed, currency, true) : "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-muted-foreground">Lent</p>
            <p className="mt-1 text-sm font-semibold">
              {lent.length > 0 ? formatCurrency(totalLent, currency, true) : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {topLoans.map(({ loan, displayRemainingPrincipal }) => {
            const progress = Math.max(0, Math.min(100, loan.summary.progressPercent));
            return (
              <Link key={loan.id} href={`/loans/${loan.id}`} className="block space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1 font-medium">{loan.name}</span>
                  <span className="text-muted-foreground shrink-0">{loan.summary.currentAnnualRate.toFixed(2)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${loan.direction === "borrowed" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>
                    {loan.currency === currency
                      ? formatCurrency(loan.remainingPrincipal, loan.currency)
                      : `${formatCurrency(displayRemainingPrincipal, currency, true)} · ${formatCurrency(loan.remainingPrincipal, loan.currency, true)}`}
                  </span>
                  <span>
                    {loan.summary.nextDueDate
                      ? new Date(loan.summary.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Closed"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

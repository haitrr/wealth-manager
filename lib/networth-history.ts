export interface TxRecord {
  date: Date;
  amount: number;
  type: "income" | "expense";
  accountId: string;
  accountCurrency: string;
}

export interface AssetHistoryRecord {
  assetId: string;
  date: Date;
  value: number;
  currency: string;
}


export interface LoanRecord {
  id: string;
  direction: "borrowed" | "lent";
  initialAmount: number;
  currency: string;
  startDate: Date;
  principalPayments: { date: Date; amount: number }[];
}

export interface ExchangeRateRecord {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export interface HistoryPoint {
  date: string;
  total: number;
  liquid: number;
  assets: number;
  liabilities: number;
}

export function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateRecord[]
): number {
  if (fromCurrency === toCurrency) return amount;
  const direct = rates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
  if (direct) return amount * direct.rate;
  const inverse = rates.find(r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency);
  if (inverse) return amount / inverse.rate;
  return amount;
}

export function computeNetWorthHistory(
  transactions: TxRecord[],
  assetHistories: AssetHistoryRecord[],
  loans: LoanRecord[],
  exchangeRates: ExchangeRateRecord[],
  targetCurrency: string,
  dates: Date[]
): HistoryPoint[] {
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Pre-group asset histories by assetId, sorted ascending by date
  const historiesByAsset = new Map<string, AssetHistoryRecord[]>();
  for (const h of assetHistories) {
    const list = historiesByAsset.get(h.assetId) ?? [];
    list.push(h);
    historiesByAsset.set(h.assetId, list);
  }
  for (const [assetId, list] of historiesByAsset) {
    historiesByAsset.set(assetId, list.sort((a, b) => a.date.getTime() - b.date.getTime()));
  }

  const borrowedLoans = loans.filter(l => l.direction === "borrowed");

  return sortedDates.map(date => {
    const dateStr = toDateStr(date);

    // Liquid: sum account balances up to this date
    const accountBalances = new Map<string, { balance: number; currency: string }>();
    for (const tx of transactions) {
      if (toDateStr(tx.date) <= dateStr) {
        const cur = accountBalances.get(tx.accountId) ?? { balance: 0, currency: tx.accountCurrency };
        accountBalances.set(tx.accountId, {
          balance: cur.balance + (tx.type === "income" ? tx.amount : -tx.amount),
          currency: tx.accountCurrency,
        });
      }
    }
    const liquid = Array.from(accountBalances.values()).reduce(
      (sum, { balance, currency }) =>
        sum + convertCurrency(balance, currency, targetCurrency, exchangeRates),
      0
    );

    // Assets: step interpolation — latest entry on or before dateStr
    const assets = Array.from(historiesByAsset.values()).reduce((sum, entries) => {
      const entry = [...entries].reverse().find(e => toDateStr(e.date) <= dateStr);
      if (!entry) return sum;
      return sum + convertCurrency(entry.value, entry.currency, targetCurrency, exchangeRates);
    }, 0);

    // Liabilities: outstanding principal for borrowed loans (only after loan start date)
    const liabilities = borrowedLoans.reduce((sum, loan) => {
      if (toDateStr(loan.startDate) > dateStr) return sum;
      const paidPrincipal = loan.principalPayments
        .filter(p => toDateStr(p.date) <= dateStr)
        .reduce((s, p) => s + p.amount, 0);
      const outstanding = Math.max(0, loan.initialAmount - paidPrincipal);
      return sum + convertCurrency(outstanding, loan.currency, targetCurrency, exchangeRates);
    }, 0);

    return { date: dateStr, total: liquid + assets - liabilities, liquid, assets, liabilities };
  });
}

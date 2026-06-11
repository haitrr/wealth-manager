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
  if (dates.length === 0) return [];

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Pre-sort transactions and cache their dateStrs once
  const sortedTxs = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const txDateStrs = sortedTxs.map(tx => toDateStr(tx.date));

  // Pre-group asset histories by assetId, sorted ascending, with cached dateStrs
  const historiesByAsset = new Map<string, { dateStr: string; value: number; currency: string }[]>();
  for (const h of assetHistories) {
    const list = historiesByAsset.get(h.assetId) ?? [];
    list.push({ dateStr: toDateStr(h.date), value: h.value, currency: h.currency });
    historiesByAsset.set(h.assetId, list);
  }
  for (const [id, list] of historiesByAsset) {
    historiesByAsset.set(id, list.sort((a, b) => a.dateStr.localeCompare(b.dateStr)));
  }

  // Pre-process loans: sort payments, cache dateStrs
  const borrowedLoanStates = loans
    .filter(l => l.direction === "borrowed")
    .map(loan => ({
      loan,
      startDateStr: toDateStr(loan.startDate),
      payments: loan.principalPayments
        .map(p => ({ dateStr: toDateStr(p.date), amount: p.amount }))
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
      ptr: 0,
      paidPrincipal: 0,
    }));

  // Running state — advanced monotonically as dates are processed in order
  let txPtr = 0;
  const accountBalances = new Map<string, { balance: number; currency: string }>();
  const assetPtrs = new Map<string, number>(Array.from(historiesByAsset.keys(), id => [id, 0]));

  const result: HistoryPoint[] = [];

  for (const date of sortedDates) {
    const dateStr = toDateStr(date);

    // Advance transaction pointer — each tx is processed at most once total
    while (txPtr < sortedTxs.length && txDateStrs[txPtr] <= dateStr) {
      const tx = sortedTxs[txPtr];
      const cur = accountBalances.get(tx.accountId) ?? { balance: 0, currency: tx.accountCurrency };
      accountBalances.set(tx.accountId, {
        balance: cur.balance + (tx.type === "income" ? tx.amount : -tx.amount),
        currency: tx.accountCurrency,
      });
      txPtr++;
    }

    const liquid = Array.from(accountBalances.values()).reduce(
      (sum, { balance, currency }) =>
        sum + convertCurrency(balance, currency, targetCurrency, exchangeRates),
      0
    );

    // Advance per-asset pointer — each history entry is processed at most once total
    let assets = 0;
    for (const [assetId, entries] of historiesByAsset) {
      let ptr = assetPtrs.get(assetId)!;
      while (ptr < entries.length && entries[ptr].dateStr <= dateStr) ptr++;
      assetPtrs.set(assetId, ptr);
      if (ptr > 0) {
        const e = entries[ptr - 1];
        assets += convertCurrency(e.value, e.currency, targetCurrency, exchangeRates);
      }
    }

    // Advance per-loan payment pointer — each payment is processed at most once total
    let liabilities = 0;
    for (const state of borrowedLoanStates) {
      if (state.startDateStr > dateStr) continue;
      while (state.ptr < state.payments.length && state.payments[state.ptr].dateStr <= dateStr) {
        state.paidPrincipal += state.payments[state.ptr].amount;
        state.ptr++;
      }
      const outstanding = Math.max(0, state.loan.initialAmount - state.paidPrincipal);
      liabilities += convertCurrency(outstanding, state.loan.currency, targetCurrency, exchangeRates);
    }

    result.push({ date: dateStr, total: liquid + assets - liabilities, liquid, assets, liabilities });
  }

  return result;
}

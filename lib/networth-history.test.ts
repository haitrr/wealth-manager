import { describe, expect, it } from "vitest";
import { computeNetWorthHistory, toDateStr } from "./networth-history";

describe("toDateStr", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateStr(new Date("2024-03-15T00:00:00.000Z"))).toBe("2024-03-15");
  });
});

describe("computeNetWorthHistory", () => {
  it("returns empty array for no dates", () => {
    expect(computeNetWorthHistory([], [], [], [], "USD", [])).toEqual([]);
  });

  it("computes liquid from income and expense transactions", () => {
    const txs = [
      { date: new Date("2024-01-15T00:00:00.000Z"), amount: 1000, type: "income" as const, accountId: "a1", accountCurrency: "USD" },
      { date: new Date("2024-01-20T00:00:00.000Z"), amount: 200, type: "expense" as const, accountId: "a1", accountCurrency: "USD" },
    ];
    const result = computeNetWorthHistory(txs, [], [], [], "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result).toHaveLength(1);
    expect(result[0].liquid).toBe(800);
    expect(result[0].assets).toBe(0);
    expect(result[0].liabilities).toBe(0);
    expect(result[0].total).toBe(800);
  });

  it("excludes transactions after the plot date", () => {
    const txs = [
      { date: new Date("2024-01-15T00:00:00.000Z"), amount: 1000, type: "income" as const, accountId: "a1", accountCurrency: "USD" },
      { date: new Date("2024-02-01T00:00:00.000Z"), amount: 500, type: "income" as const, accountId: "a1", accountCurrency: "USD" },
    ];
    const result = computeNetWorthHistory(txs, [], [], [], "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].liquid).toBe(1000);
  });

  it("includes transactions on the plot date itself", () => {
    const txs = [
      { date: new Date("2024-01-31T00:00:00.000Z"), amount: 500, type: "income" as const, accountId: "a1", accountCurrency: "USD" },
    ];
    const result = computeNetWorthHistory(txs, [], [], [], "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].liquid).toBe(500);
  });

  it("uses step interpolation: takes the most recent asset history entry on or before the date", () => {
    const assetHistories = [
      { assetId: "asset1", date: new Date("2024-01-01T00:00:00.000Z"), value: 50000, currency: "USD" },
      { assetId: "asset1", date: new Date("2024-03-01T00:00:00.000Z"), value: 60000, currency: "USD" },
    ];
    const result = computeNetWorthHistory([], assetHistories, [], [], "USD", [
      new Date("2024-02-01T00:00:00.000Z"),
      new Date("2024-03-15T00:00:00.000Z"),
    ]);
    expect(result[0].assets).toBe(50000);
    expect(result[1].assets).toBe(60000);
  });

  it("returns 0 for an asset with no history entry on or before the date", () => {
    const assetHistories = [
      { assetId: "asset1", date: new Date("2024-03-01T00:00:00.000Z"), value: 50000, currency: "USD" },
    ];
    const result = computeNetWorthHistory([], assetHistories, [], [], "USD", [new Date("2024-01-01T00:00:00.000Z")]);
    expect(result[0].assets).toBe(0);
  });

  it("computes outstanding loan principal after payments", () => {
    const loans = [
      {
        id: "loan1",
        direction: "borrowed" as const,
        initialAmount: 10000,
        currency: "USD",
        principalPayments: [
          { date: new Date("2024-01-15T00:00:00.000Z"), amount: 1000 },
        ],
      },
    ];
    const result = computeNetWorthHistory([], [], loans, [], "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].liabilities).toBe(9000);
    expect(result[0].total).toBe(-9000);
  });

  it("excludes loan payments after the plot date", () => {
    const loans = [
      {
        id: "loan1",
        direction: "borrowed" as const,
        initialAmount: 10000,
        currency: "USD",
        principalPayments: [
          { date: new Date("2024-02-01T00:00:00.000Z"), amount: 2000 },
        ],
      },
    ];
    const result = computeNetWorthHistory([], [], loans, [], "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].liabilities).toBe(10000);
  });

  it("ignores lent loans in liabilities", () => {
    const loans = [
      {
        id: "loan1",
        direction: "lent" as const,
        initialAmount: 5000,
        currency: "USD",
        principalPayments: [],
      },
    ];
    const result = computeNetWorthHistory([], [], loans, [], "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].liabilities).toBe(0);
  });

  it("converts account currency to target using exchange rates", () => {
    const txs = [
      { date: new Date("2024-01-15T00:00:00.000Z"), amount: 23000000, type: "income" as const, accountId: "a1", accountCurrency: "VND" },
    ];
    const rates = [{ fromCurrency: "VND", toCurrency: "USD", rate: 1 / 23000 }];
    const result = computeNetWorthHistory(txs, [], [], rates, "USD", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].liquid).toBeCloseTo(1000, 5);
  });

  it("converts asset currency using inverse exchange rate", () => {
    const assetHistories = [
      { assetId: "asset1", date: new Date("2024-01-01T00:00:00.000Z"), value: 1, currency: "USD" },
    ];
    const rates = [{ fromCurrency: "USD", toCurrency: "VND", rate: 23000 }];
    const result = computeNetWorthHistory([], assetHistories, [], rates, "VND", [new Date("2024-01-31T00:00:00.000Z")]);
    expect(result[0].assets).toBe(23000);
  });

  it("returns dates sorted ascending", () => {
    const dates = [
      new Date("2024-03-01T00:00:00.000Z"),
      new Date("2024-01-01T00:00:00.000Z"),
      new Date("2024-02-01T00:00:00.000Z"),
    ];
    const result = computeNetWorthHistory([], [], [], [], "USD", dates);
    expect(result.map(r => r.date)).toEqual(["2024-01-01", "2024-02-01", "2024-03-01"]);
  });
});

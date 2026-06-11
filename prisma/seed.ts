import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.POSTGRES_PRISMA_URL ?? "postgres://postgres:postgres@localhost:54523/wm";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete assets first (they hold FK refs to transactions via RESTRICT)
  await prisma.asset.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.budget.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.loanPayment.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.loan.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.transaction.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.transactionCategory.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.account.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.exchangeRate.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.userSettings.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.user.deleteMany({ where: { email: "test@example.com" } });

  const password = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({ data: { email: "test@example.com", password } });
  await prisma.userSettings.create({ data: { userId: user.id, defaultCurrency: "VND" } });

  const [checking, savings] = await Promise.all([
    prisma.account.create({
      data: { name: "Tài khoản thanh toán", balance: 0, currency: "VND", isDefault: true, userId: user.id },
    }),
    prisma.account.create({
      data: { name: "Tiết kiệm", balance: 0, currency: "VND", userId: user.id },
    }),
  ]);

  const cats = await prisma.transactionCategory.createManyAndReturn({
    data: [
      { name: "Số dư đầu kỳ", type: "income", userId: user.id },
      { name: "Lương", type: "income", userId: user.id },
      { name: "Freelance", type: "income", userId: user.id },
      { name: "Ăn uống", type: "expense", userId: user.id },
      { name: "Đi lại", type: "expense", userId: user.id },
      { name: "Điện nước", type: "expense", userId: user.id },
      { name: "Giải trí", type: "expense", userId: user.id },
      { name: "Thuê nhà", type: "expense", userId: user.id },
      { name: "Thẻ tín dụng", type: "expense", userId: user.id },
      { name: "Cho vay", type: "income", userId: user.id },
    ],
  });
  const c = Object.fromEntries(cats.map((x: { name: string; id: string }) => [x.name, x.id]));

  await prisma.exchangeRate.createMany({
    data: [
      { fromCurrency: "USD", toCurrency: "VND", rate: 25000, userId: user.id },
      { fromCurrency: "VND", toCurrency: "USD", rate: 0.00004, userId: user.id },
    ],
  });

  const d = (s: string) => new Date(s + "T00:00:00.000Z");
  const today = new Date();
  const monthDate = (offset: number, day: number) => {
    const t = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return new Date(t.getFullYear(), t.getMonth(), Math.min(day, last));
  };
  const mn = (offset: number) => monthDate(offset, 1).getMonth() + 1;

  // ── Opening balances (Jan 2022) ───────────────────────────────────────────
  // User had been saving for years before we started tracking. 2.5B in checking,
  // 500M in dedicated savings.
  await prisma.transaction.createMany({
    data: [
      { amount: 4_000_000_000, date: d("2022-01-01"), description: "Số dư tiết kiệm tích lũy", accountId: checking.id, categoryId: c["Số dư đầu kỳ"], userId: user.id },
      { amount: 500_000_000, date: d("2022-01-01"), description: "Số dư tiết kiệm tích lũy", accountId: savings.id, categoryId: c["Số dư đầu kỳ"], userId: user.id },
    ],
  });

  // ── Quarterly history 2022–2023 (summarized for graph) ───────────────────
  // Each quarter: bulk salary + freelance income, bulk living expenses + rent
  type Quarter = { date: string; salary: number; freelance: number; living: number; rent: number };
  const quarters: Quarter[] = [
    // 2022 — before house
    { date: "2022-03-31", salary: 18_000_000 * 3, freelance: 5_000_000, living: 9_500_000 * 3, rent: 6_000_000 * 3 },
    { date: "2022-06-14", salary: 18_000_000 * 3, freelance: 8_000_000, living: 9_500_000 * 3, rent: 6_000_000 * 3 },
    // 2022 — after house (Jun 15), still renting until they can move in
    { date: "2022-09-30", salary: 18_000_000 * 3, freelance: 5_000_000, living: 9_500_000 * 3, rent: 6_000_000 * 3 },
    { date: "2022-12-31", salary: 18_000_000 * 3, freelance: 12_000_000, living: 11_000_000 * 3, rent: 6_000_000 * 3 },
    // 2023
    { date: "2023-03-31", salary: 20_000_000 * 3, freelance: 8_000_000, living: 10_000_000 * 3, rent: 6_000_000 * 3 },
    { date: "2023-06-30", salary: 20_000_000 * 3, freelance: 5_000_000, living: 10_000_000 * 3, rent: 6_000_000 * 3 },
    { date: "2023-09-30", salary: 20_000_000 * 3, freelance: 10_000_000, living: 10_000_000 * 3, rent: 6_000_000 * 3 },
    { date: "2023-12-31", salary: 20_000_000 * 3, freelance: 15_000_000, living: 12_000_000 * 3, rent: 6_000_000 * 3 },
  ];

  for (const q of quarters) {
    await prisma.transaction.createMany({
      data: [
        { amount: q.salary, date: d(q.date), description: `Lương ${q.date.slice(0, 7)}`, accountId: checking.id, categoryId: c["Lương"], userId: user.id },
        { amount: q.freelance, date: d(q.date), description: `Freelance ${q.date.slice(0, 7)}`, accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
        { amount: q.living, date: d(q.date), description: `Chi tiêu sinh hoạt ${q.date.slice(0, 7)}`, accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
        { amount: q.rent, date: d(q.date), description: `Tiền thuê nhà ${q.date.slice(0, 7)}`, accountId: checking.id, categoryId: c["Thuê nhà"], userId: user.id },
      ],
    });
  }

  // ── Monthly history Jan 2024 – 4 months ago (simplified) ─────────────────
  // Today is Jun 2026, so -29 months = Jan 2024. Stop at -4 (Feb 2026).
  for (let m = -29; m <= -4; m++) {
    const hasFree = m % 3 === 0;
    await prisma.transaction.createMany({
      data: [
        { amount: 20_000_000, date: monthDate(m, 1), description: `Lương tháng ${mn(m)}`, accountId: checking.id, categoryId: c["Lương"], userId: user.id },
        { amount: 6_000_000, date: monthDate(m, 1), description: `Thuê nhà tháng ${mn(m)}`, accountId: checking.id, categoryId: c["Thuê nhà"], userId: user.id },
        { amount: 3_500_000, date: monthDate(m, 8), description: `Ăn uống tháng ${mn(m)}`, accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
        { amount: 800_000, date: monthDate(m, 10), description: `Đi lại tháng ${mn(m)}`, accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
        { amount: 600_000, date: monthDate(m, 5), description: `Điện nước tháng ${mn(m)}`, accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
        { amount: 180_000, date: monthDate(m, 15), description: "Netflix & Spotify", accountId: checking.id, categoryId: c["Giải trí"], userId: user.id },
        ...(hasFree ? [{ amount: 5_000_000, date: monthDate(m, 20), description: "Dự án freelance", accountId: checking.id, categoryId: c["Freelance"], userId: user.id }] : []),
      ],
    });
  }

  // ── Detailed transactions: last 3 months ─────────────────────────────────
  await prisma.transaction.createMany({
    data: [
      // Month -3
      { amount: 20_000_000, date: monthDate(-3, 1), description: `Lương tháng ${mn(-3)}`, accountId: checking.id, categoryId: c["Lương"], userId: user.id },
      { amount: 6_000_000, date: monthDate(-3, 1), description: `Thuê nhà tháng ${mn(-3)}`, accountId: checking.id, categoryId: c["Thuê nhà"], userId: user.id },
      { amount: 580_000, date: monthDate(-3, 4), description: "Tiền điện nước", accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
      { amount: 4_000_000, date: monthDate(-3, 5), description: "Freelance backend project", accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 900_000, date: monthDate(-3, 8), description: "Siêu thị tuần 1", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 350_000, date: monthDate(-3, 10), description: "Grab đi làm", accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
      { amount: 3_000_000, date: monthDate(-3, 15), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: c["Thẻ tín dụng"], userId: user.id },
      { amount: 180_000, date: monthDate(-3, 18), description: "Netflix & Spotify", accountId: checking.id, categoryId: c["Giải trí"], userId: user.id },
      { amount: 750_000, date: monthDate(-3, 20), description: "Ăn tối cuối tuần", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 200_000, date: monthDate(-3, 22), description: "Xăng xe", accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
      { amount: 1_200_000, date: monthDate(-3, 25), description: "Siêu thị tuần 4", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 500_000, date: monthDate(-3, 28), description: "Bia bạn bè", accountId: checking.id, categoryId: c["Giải trí"], userId: user.id },

      // Month -2
      { amount: 20_000_000, date: monthDate(-2, 1), description: `Lương tháng ${mn(-2)}`, accountId: checking.id, categoryId: c["Lương"], userId: user.id },
      { amount: 6_000_000, date: monthDate(-2, 1), description: `Thuê nhà tháng ${mn(-2)}`, accountId: checking.id, categoryId: c["Thuê nhà"], userId: user.id },
      { amount: 600_000, date: monthDate(-2, 3), description: "Điện nước", accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
      { amount: 6_000_000, date: monthDate(-2, 12), description: "Freelance thiết kế website", accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 750_000, date: monthDate(-2, 14), description: "Ăn tối nhà hàng", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 3_500_000, date: monthDate(-2, 15), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: c["Thẻ tín dụng"], userId: user.id },
      { amount: 980_000, date: monthDate(-2, 18), description: "Siêu thị tuần 3", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 350_000, date: monthDate(-2, 20), description: "Grab tháng", accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
      { amount: 180_000, date: monthDate(-2, 22), description: "Netflix & Spotify", accountId: checking.id, categoryId: c["Giải trí"], userId: user.id },

      // Month -1
      { amount: 20_000_000, date: monthDate(-1, 1), description: `Lương tháng ${mn(-1)}`, accountId: checking.id, categoryId: c["Lương"], userId: user.id },
      { amount: 6_000_000, date: monthDate(-1, 1), description: `Thuê nhà tháng ${mn(-1)}`, accountId: checking.id, categoryId: c["Thuê nhà"], userId: user.id },
      { amount: 650_000, date: monthDate(-1, 3), description: "Điện nước", accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
      { amount: 120_000, date: monthDate(-1, 4), description: "Cà phê & bánh mì", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 350_000, date: monthDate(-1, 5), description: "Grab tuần 1", accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
      { amount: 890_000, date: monthDate(-1, 6), description: "Siêu thị Co.opmart", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 8_000_000, date: monthDate(-1, 7), description: "Dự án thiết kế website", accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 450_000, date: monthDate(-1, 8), description: "Ăn trưa văn phòng", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 180_000, date: monthDate(-1, 10), description: "Netflix & Spotify", accountId: checking.id, categoryId: c["Giải trí"], userId: user.id },
      { amount: 1_200_000, date: monthDate(-1, 11), description: "Mua thực phẩm tuần 2", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 3_000_000, date: monthDate(-1, 14), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: c["Thẻ tín dụng"], userId: user.id },
      { amount: 2_000_000, date: monthDate(-1, 19), description: "Bạn trả nợ", accountId: savings.id, categoryId: c["Cho vay"], userId: user.id },
      { amount: 3_000_000, date: monthDate(-1, 28), description: "Freelance UI design", accountId: checking.id, categoryId: c["Freelance"], userId: user.id },

      // Current month
      { amount: 20_000_000, date: monthDate(0, 1), description: `Lương tháng ${mn(0)}`, accountId: checking.id, categoryId: c["Lương"], userId: user.id },
      { amount: 6_000_000, date: monthDate(0, 1), description: `Thuê nhà tháng ${mn(0)}`, accountId: checking.id, categoryId: c["Thuê nhà"], userId: user.id },
      { amount: 85_000, date: monthDate(0, 1), description: "Cà phê sáng", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 350_000, date: monthDate(0, 2), description: "Grab đi làm", accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
      { amount: 220_000, date: monthDate(0, 2), description: "Bún bò gia đình", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 5_000_000, date: monthDate(0, 2), description: "Dự án app mobile", accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 670_000, date: monthDate(0, 3), description: "Siêu thị Vinmart", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
      { amount: 180_000, date: monthDate(0, 3), description: "Xăng xe", accountId: checking.id, categoryId: c["Đi lại"], userId: user.id },
      { amount: 300_000, date: monthDate(0, 3), description: "Cinema CGV", accountId: checking.id, categoryId: c["Giải trí"], userId: user.id },
    ],
  });

  // ── Budgets ───────────────────────────────────────────────────────────────
  const monthStart = monthDate(-1, 1);
  await prisma.budget.createMany({
    data: [
      { name: "Ăn uống hàng tháng", amount: 4_000_000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [c["Ăn uống"]], userId: user.id },
      { name: "Đi lại", amount: 1_500_000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [c["Đi lại"]], userId: user.id },
      { name: "Giải trí", amount: 1_000_000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [c["Giải trí"]], userId: user.id },
      { name: "Chi tiêu tổng", amount: 15_000_000, currency: "VND", period: "monthly", startDate: monthStart, userId: user.id },
      { name: "Chi tiêu tài khoản chính", amount: 14_000_000, currency: "VND", period: "monthly", startDate: monthStart, accountId: checking.id, userId: user.id },
    ],
  });

  // ── Home loan (2022-06-15, same day as house purchase) ───────────────────
  // House = 4B VND. 50% = 2B loan from Vietcombank, 50% = 2B own capital.
  const loanReceivedCat = await prisma.transactionCategory.create({ data: { name: "Loan Received", type: "income", userId: user.id } });
  const loanGivenCat = await prisma.transactionCategory.create({ data: { name: "Loan Given", type: "expense", userId: user.id } });
  const repayCat = await prisma.transactionCategory.create({ data: { name: "Loan Repayment", type: "expense", userId: user.id } });
  const prepayFeeCat = await prisma.transactionCategory.create({ data: { name: "Loan Prepay Fee", type: "expense", userId: user.id } });
  const interestCat = await prisma.transactionCategory.create({ data: { name: "Loan Interest", type: "expense", userId: user.id } });

  const homeLoanInitialTx = await prisma.transaction.create({
    data: {
      amount: 2_000_000_000,
      date: d("2022-06-15"),
      description: "Vay mua nhà Vinhomes - giải ngân",
      accountId: checking.id,
      categoryId: loanReceivedCat.id,
      userId: user.id,
    },
  });

  const homeLoan = await prisma.loan.create({
    data: {
      name: "Vay mua nhà",
      direction: "borrowed",
      currency: "VND",
      startDate: d("2022-06-15"),
      counterpartyName: "Vietcombank",
      notes: "Vay 50% giá trị căn hộ Vinhomes Grand Park (2/4 tỷ)",
      status: "active",
      accountId: checking.id,
      initialTransactionId: homeLoanInitialTx.id,
      userId: user.id,
    },
  });

  // Principal repayments (started after 18-month grace period, Jan 2024)
  const homeLoanPrincipalPayments = [
    { date: "2026-04-01", amount: 200_000_000 },
    { date: "2026-02-04", amount: 100_000_000 },
    { date: "2026-01-15", amount: 100_000_000 },
    { date: "2026-01-08", amount: 100_000_000 },
    { date: "2025-12-07", amount: 100_000_000 },
    { date: "2025-11-23", amount: 200_000_000 },
    { date: "2025-11-20", amount: 50_000_000 },
    { date: "2025-11-10", amount: 50_000_000 },
    { date: "2025-09-25", amount: 50_000_000 },
    { date: "2025-08-24", amount: 30_000_000 },
    { date: "2025-07-30", amount: 20_000_000 },
    { date: "2025-06-04", amount: 45_000_000 },
    { date: "2025-05-14", amount: 30_000_000 },
    { date: "2025-05-10", amount: 25_000_000 },
    { date: "2025-02-05", amount: 36_000_000 },
    { date: "2025-01-03", amount: 30_000_000 },
    { date: "2024-11-20", amount: 10_000_000 },
    { date: "2024-08-19", amount: 10_000_000 },
    { date: "2024-07-20", amount: 10_000_000 },
    { date: "2024-06-19", amount: 20_000_000 },
    { date: "2024-06-03", amount: 10_000_000 },
    { date: "2024-05-31", amount: 10_000_000 },
    { date: "2024-05-09", amount: 10_000_000 },
    { date: "2024-04-19", amount: 10_000_000 },
    { date: "2024-04-05", amount: 12_000_000 },
    { date: "2024-03-24", amount: 10_000_000 },
    { date: "2024-02-28", amount: 12_000_000 },
    { date: "2024-01-15", amount: 12_000_000 },
  ];

  for (const p of homeLoanPrincipalPayments) {
    const principalTx = await prisma.transaction.create({
      data: { amount: p.amount, date: d(p.date), description: `Trả nợ gốc VCB`, accountId: checking.id, categoryId: repayCat.id, userId: user.id },
    });
    const feeTx = await prisma.transaction.create({
      data: { amount: Math.round(p.amount * 0.01), date: d(p.date), description: `Phí trả trước hạn VCB`, accountId: checking.id, categoryId: prepayFeeCat.id, userId: user.id },
    });
    await prisma.loanPayment.create({
      data: { loanId: homeLoan.id, accountId: checking.id, paymentDate: d(p.date), principalTransactionId: principalTx.id, prepayFeeTransactionId: feeTx.id, userId: user.id },
    });
  }

  // Interest payments (monthly since Jun 2022, on full 2B balance initially)
  const homeLoanInterestPayments = [
    { date: "2026-05-27", amount: 5_950_000 },
    { date: "2026-03-27", amount: 6_840_000 },
    { date: "2026-02-28", amount: 8_000_000 },
    { date: "2026-01-27", amount: 6_210_000 },
    { date: "2025-11-27", amount: 8_375_000 },
    { date: "2025-10-27", amount: 9_000_000 },
    { date: "2025-09-27", amount: 9_000_000 },
    { date: "2025-08-27", amount: 8_810_000 },
    { date: "2025-06-27", amount: 9_605_000 },
    { date: "2025-04-27", amount: 10_100_000 },
    { date: "2025-03-26", amount: 9_115_000 },
    { date: "2025-02-27", amount: 7_500_000 },
    { date: "2025-02-04", amount: 13_000_000 },
    { date: "2024-12-27", amount: 10_125_000 },
    { date: "2024-11-30", amount: 7_980_000 },
    { date: "2024-11-26", amount: 1_855_000 },
    { date: "2024-09-27", amount: 10_516_000 },
    { date: "2024-08-27", amount: 10_560_000 },
    { date: "2024-07-27", amount: 10_275_000 },
    { date: "2024-06-27", amount: 10_389_000 },
    { date: "2024-05-27", amount: 10_876_000 },
    // Grace period 2022–2023: interest only
    { date: "2023-12-27", amount: 11_200_000 },
    { date: "2023-11-27", amount: 11_200_000 },
    { date: "2023-10-27", amount: 11_200_000 },
    { date: "2023-09-27", amount: 11_200_000 },
    { date: "2023-08-27", amount: 11_200_000 },
    { date: "2023-07-27", amount: 11_200_000 },
    { date: "2023-06-27", amount: 11_200_000 },
    { date: "2023-05-27", amount: 11_200_000 },
    { date: "2023-04-27", amount: 11_200_000 },
    { date: "2023-03-27", amount: 11_200_000 },
    { date: "2023-02-27", amount: 11_200_000 },
    { date: "2023-01-27", amount: 11_200_000 },
    { date: "2022-12-27", amount: 11_200_000 },
    { date: "2022-11-27", amount: 11_200_000 },
    { date: "2022-10-27", amount: 11_200_000 },
    { date: "2022-09-27", amount: 11_200_000 },
    { date: "2022-08-27", amount: 11_200_000 },
    { date: "2022-07-27", amount: 11_200_000 },
  ];

  for (const p of homeLoanInterestPayments) {
    const interestTx = await prisma.transaction.create({
      data: { amount: p.amount, date: d(p.date), description: `Lãi vay VCB`, accountId: checking.id, categoryId: interestCat.id, userId: user.id },
    });
    await prisma.loanPayment.create({
      data: { loanId: homeLoan.id, accountId: checking.id, paymentDate: d(p.date), interestTransactionId: interestTx.id, userId: user.id },
    });
  }

  // Lent loan (friend)
  const lentLoanInitialTx = await prisma.transaction.create({
    data: { amount: 10_000_000, date: d("2025-12-01"), description: "Cho Nguyễn Văn A vay", accountId: savings.id, categoryId: loanGivenCat.id, userId: user.id },
  });
  await prisma.loan.create({
    data: { name: "Cho bạn vay", direction: "lent", currency: "VND", startDate: d("2025-12-01"), counterpartyName: "Nguyễn Văn A", status: "active", accountId: savings.id, initialTransactionId: lentLoanInitialTx.id, userId: user.id },
  });

  // ── Assets ────────────────────────────────────────────────────────────────
  // All purchase transactions debit checking (where salary and loan proceeds land).
  // The house: loan proceeds (+2B) + own savings (–2B) = full 4B purchase.
  const assetPurchaseCat = await prisma.transactionCategory.create({ data: { name: "Asset Purchase", type: "expense", userId: user.id } });

  type AssetDef = {
    name: string; type: "real_estate" | "stock" | "bond" | "gold"; currency: "VND" | "USD";
    currentValue: number; purchasePrice: number; purchaseDate: Date;
    quantity?: number; ticker?: string; metadata: Record<string, unknown>;
  };

  const assetDefs: AssetDef[] = [
    {
      name: "Căn hộ Vinhomes Grand Park",
      type: "real_estate", currency: "VND",
      currentValue: 5_500_000_000,
      purchasePrice: 4_000_000_000,  // 2B loan (50%) + 2B own (50%)
      purchaseDate: d("2022-06-15"),
      metadata: { address: "Vinhomes Grand Park, Thủ Đức, TP.HCM" },
    },
    {
      name: "Apple (AAPL)",
      type: "stock", currency: "USD",
      currentValue: 2_310,     // 10 shares × $231
      quantity: 10,
      ticker: "AAPL",
      purchasePrice: 1_900,    // 10 shares × $190
      purchaseDate: d("2023-01-15"),
      metadata: { exchange: "NASDAQ" },
    },
    {
      name: "VN30 ETF",
      type: "stock", currency: "VND",
      currentValue: 18_000_000,
      quantity: 1000,
      ticker: "E1VFVN30",
      purchasePrice: 15_000_000,
      purchaseDate: d("2023-06-01"),
      metadata: { exchange: "HOSE" },
    },
    {
      name: "Trái phiếu Chính phủ",
      type: "bond", currency: "VND",
      currentValue: 100_000_000,
      purchasePrice: 100_000_000,
      purchaseDate: d("2023-03-01"),
      metadata: { issuer: "Bộ Tài chính Việt Nam", interestRate: 5.8, maturityDate: "2028-03-01" },
    },
    {
      name: "Vàng SJC",
      type: "gold", currency: "VND",
      currentValue: 92_000_000,
      quantity: 1,
      purchasePrice: 74_000_000,
      purchaseDate: d("2024-01-10"),
      metadata: { form: "physical" },
    },
  ];

  // Value history snapshots: quarterly from purchaseDate up to today.
  // purchasePrice is the baseline (handled by syntheticRecords in the API),
  // so we only insert records AFTER the purchase date.
  const assetValueSnapshots: Record<string, { date: Date; value: number }[]> = {
    "Căn hộ Vinhomes Grand Park": [
      // ~3.5% appreciation per quarter over ~3.5 years (4B → 5.5B)
      { date: d("2022-09-15"), value: 4_140_000_000 },
      { date: d("2022-12-15"), value: 4_280_000_000 },
      { date: d("2023-03-15"), value: 4_430_000_000 },
      { date: d("2023-06-15"), value: 4_590_000_000 },
      { date: d("2023-09-15"), value: 4_750_000_000 },
      { date: d("2023-12-15"), value: 4_920_000_000 },
      { date: d("2024-03-15"), value: 5_090_000_000 },
      { date: d("2024-06-15"), value: 5_200_000_000 },
      { date: d("2024-09-15"), value: 5_320_000_000 },
      { date: d("2024-12-15"), value: 5_420_000_000 },
      { date: d("2025-03-15"), value: 5_500_000_000 },
    ],
    "Apple (AAPL)": [
      // 10 shares: $190 → $231 per share over ~2.5 years
      { date: d("2023-06-15"), value: 2_000 },
      { date: d("2023-12-15"), value: 2_100 },
      { date: d("2024-06-15"), value: 2_200 },
      { date: d("2024-12-15"), value: 2_250 },
      { date: d("2025-06-15"), value: 2_310 },
    ],
    "VN30 ETF": [
      // 1000 units: 15M → 18M
      { date: d("2023-12-01"), value: 15_800_000 },
      { date: d("2024-06-01"), value: 16_500_000 },
      { date: d("2024-12-01"), value: 17_200_000 },
      { date: d("2025-06-01"), value: 18_000_000 },
    ],
    "Vàng SJC": [
      // 74M → 92M
      { date: d("2024-06-10"), value: 79_000_000 },
      { date: d("2024-12-10"), value: 85_000_000 },
      { date: d("2025-06-10"), value: 92_000_000 },
    ],
  };

  for (const def of assetDefs) {
    const purchaseTx = await prisma.transaction.create({
      data: {
        amount: def.purchasePrice,
        date: def.purchaseDate,
        description: `Purchase: ${def.name}`,
        accountId: checking.id,
        categoryId: assetPurchaseCat.id,
        userId: user.id,
      },
    });
    const asset = await prisma.asset.create({
      data: {
        name: def.name,
        type: def.type,
        currency: def.currency,
        currentValue: def.currentValue,
        quantity: def.quantity ?? null,
        ticker: def.ticker ?? null,
        purchasePrice: def.purchasePrice,
        purchaseDate: def.purchaseDate,
        metadata: def.metadata as Prisma.InputJsonValue,
        purchaseTransactionId: purchaseTx.id,
        userId: user.id,
      },
    });

    const snapshots = assetValueSnapshots[def.name];
    if (snapshots) {
      await prisma.assetValueHistory.createMany({
        data: snapshots.map(s => ({ assetId: asset.id, date: s.date, value: s.value })),
      });
    }
  }

  console.log("Seed complete.");
  console.log("  Email:    test@example.com");
  console.log("  Password: password123");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.POSTGRES_PRISMA_URL ?? "postgres://postgres:postgres@localhost:54523/wm";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete assets first (FK RESTRICT on purchaseTransactionId)
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
      { name: "Lương", type: "income", userId: user.id },
      { name: "Freelance", type: "income", userId: user.id },
      { name: "Đầu tư", type: "income", userId: user.id },
      { name: "Cho vay", type: "income", userId: user.id },
      { name: "Ăn uống", type: "expense", userId: user.id },
      { name: "Đi lại", type: "expense", userId: user.id },
      { name: "Điện nước", type: "expense", userId: user.id },
      { name: "Giải trí", type: "expense", userId: user.id },
      { name: "Thuê nhà", type: "expense", userId: user.id },
      { name: "Thẻ tín dụng", type: "expense", userId: user.id },
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

  // ── Career story (2017–2022) ──────────────────────────────────────────────
  //
  // Jul 2017  Graduate, junior dev at VNPay              8M/month
  // Jan 2018  Raise                                      10M/month
  // Jul 2018  Job jump #1 → Momo (product startup)       22M/month  ← big jump
  // 2019      Raise + active freelancing                 24M/month
  // 2020      COVID → WFH freelance boom + stock bets    26M/month
  //           Invest 150M in VN30 ETF during dip
  // Jul 2021  Job jump #2 → remote Singapore company     52M/month  ← big jump
  // Sep 2021  Sell VN30 ETF position for 330M (120% gain on 150M invested)
  // 2022      Raise                                      55M/month
  //           Saving hard — buys house Jun 2022
  //
  // Checking balance built organically; no opening balance entry.

  // Helper: create a quarterly income/expense block (one salary + one expense tx per period)
  const qTx = async (date: string, salary: number, freelance: number, living: number, rent: number) => {
    const data = [
      { amount: salary,   date: d(date), description: `Lương ${date.slice(0, 7)}`,        accountId: checking.id, categoryId: c["Lương"],     userId: user.id },
      { amount: living,   date: d(date), description: `Chi tiêu ${date.slice(0, 7)}`,      accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
    ];
    if (rent > 0)     data.push({ amount: rent,     date: d(date), description: `Tiền thuê nhà ${date.slice(0, 7)}`, accountId: checking.id, categoryId: c["Thuê nhà"],  userId: user.id });
    if (freelance > 0) data.push({ amount: freelance, date: d(date), description: `Freelance ${date.slice(0, 7)}`,    accountId: checking.id, categoryId: c["Freelance"], userId: user.id });
    await prisma.transaction.createMany({ data });
  };

  // 2017 H2 — fresh grad, 8M/month, share rented room
  await qTx("2017-12-31", 8_000_000 * 6, 0, 2_000_000 * 6, 2_500_000 * 6);

  // 2018 H1 — small raise to 10M
  await qTx("2018-06-30", 10_000_000 * 6, 0, 2_200_000 * 6, 2_500_000 * 6);

  // 2018 H2 — JOB JUMP #1: Momo, 22M/month (+120%)
  await qTx("2018-12-31", 22_000_000 * 6, 20_000_000, 3_000_000 * 6, 3_000_000 * 6);

  // 2019 — senior dev, 24M, active freelancing
  await qTx("2019-06-30", 24_000_000 * 6, 35_000_000, 3_500_000 * 6, 3_500_000 * 6);
  await qTx("2019-12-31", 24_000_000 * 6, 40_000_000, 3_500_000 * 6, 3_500_000 * 6);

  // 2020 Q1 — COVID hits, market crashes; invest 150M in VN30 ETF
  await qTx("2020-03-31", 26_000_000 * 3, 10_000_000, 3_000_000 * 3, 3_500_000 * 3);
  await prisma.transaction.create({
    data: { amount: 150_000_000, date: d("2020-03-20"), description: "Mua VN30 ETF (thị trường giảm sâu)", accountId: checking.id, categoryId: c["Đầu tư"], userId: user.id },
  });

  // 2020 Q2-Q4 — WFH freelance boom, stocks recovering
  await qTx("2020-06-30", 26_000_000 * 3, 35_000_000, 3_000_000 * 3, 3_500_000 * 3);
  await qTx("2020-09-30", 26_000_000 * 3, 40_000_000, 3_200_000 * 3, 3_500_000 * 3);
  await qTx("2020-12-31", 26_000_000 * 3, 30_000_000, 3_200_000 * 3, 3_500_000 * 3);

  // 2021 Q1-Q2 — stocks running, planning job change
  await qTx("2021-03-31", 26_000_000 * 3, 20_000_000, 3_500_000 * 3, 4_000_000 * 3);
  await qTx("2021-06-30", 26_000_000 * 3, 15_000_000, 3_500_000 * 3, 4_000_000 * 3);

  // 2021 Q3 — JOB JUMP #2: remote Singapore company, 52M (+100%)
  //           Also sell VN30 ETF: 150M invested → 330M proceeds (120% gain, VN-Index bull run)
  await qTx("2021-09-30", 52_000_000 * 3, 0, 4_000_000 * 3, 4_500_000 * 3);
  await prisma.transaction.create({
    data: { amount: 330_000_000, date: d("2021-09-10"), description: "Bán VN30 ETF — lợi nhuận 2020-2021", accountId: checking.id, categoryId: c["Đầu tư"], userId: user.id },
  });

  // 2021 Q4 — settling into new role, saving aggressively
  await qTx("2021-12-31", 52_000_000 * 3, 25_000_000, 4_500_000 * 3, 4_500_000 * 3);

  // 2022 Jan–May — raise to 55M, laser-focused on house down payment, no big spending
  await qTx("2022-01-31", 55_000_000, 0,          4_500_000, 4_500_000);
  await qTx("2022-02-28", 55_000_000, 0,          4_500_000, 4_500_000);
  await qTx("2022-03-31", 55_000_000, 20_000_000, 4_500_000, 4_500_000);
  await qTx("2022-04-30", 55_000_000, 0,          4_500_000, 4_500_000);
  await qTx("2022-05-31", 55_000_000, 0,          4_500_000, 4_500_000);
  // Transfer emergency fund to savings before house purchase
  await prisma.transaction.createMany({
    data: [
      { amount: 100_000_000, date: d("2022-05-20"), description: "Chuyển quỹ dự phòng vào tiết kiệm", accountId: savings.id, categoryId: c["Lương"], userId: user.id },
      { amount: 100_000_000, date: d("2022-05-20"), description: "Chuyển quỹ dự phòng vào tiết kiệm", accountId: checking.id, categoryId: c["Ăn uống"], userId: user.id },
    ],
  });

  // ── Home loan (2022-06-15, same day as house purchase) ───────────────────
  // House = 3B VND. 50% = 1.5B loan, 50% = 1.5B own savings.
  const loanReceivedCat = await prisma.transactionCategory.create({ data: { name: "Loan Received", type: "income", userId: user.id } });
  const loanGivenCat = await prisma.transactionCategory.create({ data: { name: "Loan Given", type: "expense", userId: user.id } });
  const repayCat = await prisma.transactionCategory.create({ data: { name: "Loan Repayment", type: "expense", userId: user.id } });
  const prepayFeeCat = await prisma.transactionCategory.create({ data: { name: "Loan Prepay Fee", type: "expense", userId: user.id } });
  const interestCat = await prisma.transactionCategory.create({ data: { name: "Loan Interest", type: "expense", userId: user.id } });

  const homeLoanInitialTx = await prisma.transaction.create({
    data: {
      amount: 1_500_000_000,
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
      notes: "Vay 50% giá trị căn hộ Vinhomes Grand Park (1.5/3 tỷ)",
      status: "active",
      accountId: checking.id,
      initialTransactionId: homeLoanInitialTx.id,
      userId: user.id,
    },
  });

  // ── 2022 Q3-Q4 post-house — moved in, no more rent, paying mortgage interest ──
  await qTx("2022-09-30", 55_000_000 * 3, 0,           5_000_000 * 3, 0);
  await qTx("2022-12-31", 55_000_000 * 3, 15_000_000,  5_500_000 * 3, 0);

  // ── 2023 — stable at 55M, investing again, saving ─────────────────────────
  await qTx("2023-03-31", 55_000_000 * 3, 0,           5_500_000 * 3, 0);
  await qTx("2023-06-30", 55_000_000 * 3, 20_000_000,  6_000_000 * 3, 0);
  await qTx("2023-09-30", 55_000_000 * 3, 10_000_000,  6_000_000 * 3, 0);
  await qTx("2023-12-31", 55_000_000 * 3, 25_000_000,  6_500_000 * 3, 0);

  // ── Monthly history Jan 2024 – 4 months ago ──────────────────────────────
  // Salary raised to 58M, no rent (own the house now)
  for (let m = -29; m <= -4; m++) {
    const hasFree = m % 3 === 0;
    await prisma.transaction.createMany({
      data: [
        { amount: 58_000_000, date: monthDate(m, 1),  description: `Lương tháng ${mn(m)}`,    accountId: checking.id, categoryId: c["Lương"],     userId: user.id },
        { amount: 5_000_000, date: monthDate(m, 8),   description: `Ăn uống tháng ${mn(m)}`,  accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
        { amount: 1_200_000, date: monthDate(m, 10),  description: `Đi lại tháng ${mn(m)}`,   accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
        { amount: 900_000,   date: monthDate(m, 5),   description: `Điện nước tháng ${mn(m)}`,accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
        { amount: 280_000,   date: monthDate(m, 15),  description: "Netflix & Spotify",        accountId: checking.id, categoryId: c["Giải trí"],  userId: user.id },
        ...(hasFree ? [{ amount: 8_000_000, date: monthDate(m, 20), description: "Dự án freelance", accountId: checking.id, categoryId: c["Freelance"], userId: user.id }] : []),
      ],
    });
  }

  // ── Detailed transactions: last 3 months ─────────────────────────────────
  await prisma.transaction.createMany({
    data: [
      // Month -3
      { amount: 58_000_000, date: monthDate(-3, 1),  description: `Lương tháng ${mn(-3)}`,      accountId: checking.id, categoryId: c["Lương"],     userId: user.id },
      { amount: 900_000,    date: monthDate(-3, 4),  description: "Tiền điện nước",              accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
      { amount: 6_000_000,  date: monthDate(-3, 5),  description: "Freelance backend project",   accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 1_200_000,  date: monthDate(-3, 8),  description: "Siêu thị tuần 1",             accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 500_000,    date: monthDate(-3, 10), description: "Grab đi làm",                 accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
      { amount: 3_500_000,  date: monthDate(-3, 15), description: "Thanh toán thẻ tín dụng",    accountId: checking.id, categoryId: c["Thẻ tín dụng"], userId: user.id },
      { amount: 280_000,    date: monthDate(-3, 18), description: "Netflix & Spotify",            accountId: checking.id, categoryId: c["Giải trí"],  userId: user.id },
      { amount: 980_000,    date: monthDate(-3, 20), description: "Ăn tối cuối tuần",            accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 250_000,    date: monthDate(-3, 22), description: "Xăng xe",                     accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
      { amount: 1_500_000,  date: monthDate(-3, 25), description: "Siêu thị tuần 4",             accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },

      // Month -2
      { amount: 58_000_000, date: monthDate(-2, 1),  description: `Lương tháng ${mn(-2)}`,      accountId: checking.id, categoryId: c["Lương"],     userId: user.id },
      { amount: 950_000,    date: monthDate(-2, 3),  description: "Điện nước",                   accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
      { amount: 9_000_000,  date: monthDate(-2, 12), description: "Freelance thiết kế website",  accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 1_100_000,  date: monthDate(-2, 14), description: "Ăn tối nhà hàng",             accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 4_000_000,  date: monthDate(-2, 15), description: "Thanh toán thẻ tín dụng",    accountId: checking.id, categoryId: c["Thẻ tín dụng"], userId: user.id },
      { amount: 1_300_000,  date: monthDate(-2, 18), description: "Siêu thị tuần 3",             accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 450_000,    date: monthDate(-2, 20), description: "Grab tháng",                   accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
      { amount: 280_000,    date: monthDate(-2, 22), description: "Netflix & Spotify",            accountId: checking.id, categoryId: c["Giải trí"],  userId: user.id },

      // Month -1
      { amount: 58_000_000, date: monthDate(-1, 1),  description: `Lương tháng ${mn(-1)}`,      accountId: checking.id, categoryId: c["Lương"],     userId: user.id },
      { amount: 870_000,    date: monthDate(-1, 3),  description: "Điện nước",                   accountId: checking.id, categoryId: c["Điện nước"], userId: user.id },
      { amount: 150_000,    date: monthDate(-1, 4),  description: "Cà phê & bánh mì",            accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 450_000,    date: monthDate(-1, 5),  description: "Grab tuần 1",                 accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
      { amount: 1_100_000,  date: monthDate(-1, 6),  description: "Siêu thị Co.opmart",          accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 12_000_000, date: monthDate(-1, 7),  description: "Freelance app fintech",        accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 600_000,    date: monthDate(-1, 8),  description: "Ăn trưa văn phòng",           accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 280_000,    date: monthDate(-1, 10), description: "Netflix & Spotify",            accountId: checking.id, categoryId: c["Giải trí"],  userId: user.id },
      { amount: 1_500_000,  date: monthDate(-1, 11), description: "Mua thực phẩm tuần 2",        accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 3_500_000,  date: monthDate(-1, 14), description: "Thanh toán thẻ tín dụng",    accountId: checking.id, categoryId: c["Thẻ tín dụng"], userId: user.id },
      { amount: 2_000_000,  date: monthDate(-1, 19), description: "Bạn trả nợ",                  accountId: savings.id,  categoryId: c["Cho vay"],   userId: user.id },
      { amount: 4_000_000,  date: monthDate(-1, 28), description: "Freelance UI design",          accountId: checking.id, categoryId: c["Freelance"], userId: user.id },

      // Current month
      { amount: 58_000_000, date: monthDate(0, 1),  description: `Lương tháng ${mn(0)}`,        accountId: checking.id, categoryId: c["Lương"],     userId: user.id },
      { amount: 110_000,    date: monthDate(0, 1),  description: "Cà phê sáng",                  accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 450_000,    date: monthDate(0, 2),  description: "Grab đi làm",                  accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
      { amount: 280_000,    date: monthDate(0, 2),  description: "Bún bò gia đình",              accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 7_000_000,  date: monthDate(0, 2),  description: "Dự án app mobile",             accountId: checking.id, categoryId: c["Freelance"], userId: user.id },
      { amount: 850_000,    date: monthDate(0, 3),  description: "Siêu thị Vinmart",             accountId: checking.id, categoryId: c["Ăn uống"],   userId: user.id },
      { amount: 220_000,    date: monthDate(0, 3),  description: "Xăng xe",                      accountId: checking.id, categoryId: c["Đi lại"],    userId: user.id },
      { amount: 380_000,    date: monthDate(0, 3),  description: "Cinema CGV",                   accountId: checking.id, categoryId: c["Giải trí"],  userId: user.id },
    ],
  });

  // ── Budgets ───────────────────────────────────────────────────────────────
  const monthStart = monthDate(-1, 1);
  await prisma.budget.createMany({
    data: [
      { name: "Ăn uống hàng tháng", amount: 6_000_000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [c["Ăn uống"]], userId: user.id },
      { name: "Đi lại",             amount: 2_000_000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [c["Đi lại"]],  userId: user.id },
      { name: "Giải trí",           amount: 1_500_000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [c["Giải trí"]], userId: user.id },
      { name: "Chi tiêu tổng",      amount: 15_000_000, currency: "VND", period: "monthly", startDate: monthStart, userId: user.id },
      { name: "Chi tiêu tài khoản chính", amount: 12_000_000, currency: "VND", period: "monthly", startDate: monthStart, accountId: checking.id, userId: user.id },
    ],
  });

  // ── Loan repayments ───────────────────────────────────────────────────────
  // Principal payments start Jan 2024 (18-month grace period post-purchase)
  const homeLoanPrincipalPayments = [
    { date: "2026-04-01", amount: 150_000_000 },
    { date: "2026-02-04", amount:  75_000_000 },
    { date: "2026-01-15", amount:  75_000_000 },
    { date: "2026-01-08", amount:  75_000_000 },
    { date: "2025-12-07", amount:  75_000_000 },
    { date: "2025-11-23", amount: 150_000_000 },
    { date: "2025-11-10", amount:  38_000_000 },
    { date: "2025-09-25", amount:  38_000_000 },
    { date: "2025-08-24", amount:  23_000_000 },
    { date: "2025-07-30", amount:  15_000_000 },
    { date: "2025-06-04", amount:  34_000_000 },
    { date: "2025-05-14", amount:  23_000_000 },
    { date: "2025-05-10", amount:  19_000_000 },
    { date: "2025-02-05", amount:  27_000_000 },
    { date: "2025-01-03", amount:  23_000_000 },
    { date: "2024-11-20", amount:   8_000_000 },
    { date: "2024-08-19", amount:   8_000_000 },
    { date: "2024-07-20", amount:   8_000_000 },
    { date: "2024-06-19", amount:  15_000_000 },
    { date: "2024-06-03", amount:   8_000_000 },
    { date: "2024-05-31", amount:   8_000_000 },
    { date: "2024-05-09", amount:   8_000_000 },
    { date: "2024-04-19", amount:   8_000_000 },
    { date: "2024-04-05", amount:   9_000_000 },
    { date: "2024-03-24", amount:   8_000_000 },
    { date: "2024-02-28", amount:   9_000_000 },
    { date: "2024-01-15", amount:   9_000_000 },
  ];

  for (const p of homeLoanPrincipalPayments) {
    const principalTx = await prisma.transaction.create({
      data: { amount: p.amount, date: d(p.date), description: "Trả nợ gốc VCB", accountId: checking.id, categoryId: repayCat.id, userId: user.id },
    });
    const feeTx = await prisma.transaction.create({
      data: { amount: Math.round(p.amount * 0.01), date: d(p.date), description: "Phí trả trước hạn VCB", accountId: checking.id, categoryId: prepayFeeCat.id, userId: user.id },
    });
    await prisma.loanPayment.create({
      data: { loanId: homeLoan.id, accountId: checking.id, paymentDate: d(p.date), principalTransactionId: principalTx.id, prepayFeeTransactionId: feeTx.id, userId: user.id },
    });
  }

  // Interest-only payments: 1.5B × 6.72% / 12 ≈ 8.4M/month during grace period
  const homeLoanInterestPayments = [
    { date: "2026-05-27", amount: 4_460_000 },
    { date: "2026-03-27", amount: 5_130_000 },
    { date: "2026-02-28", amount: 6_000_000 },
    { date: "2026-01-27", amount: 4_660_000 },
    { date: "2025-11-27", amount: 6_280_000 },
    { date: "2025-10-27", amount: 6_750_000 },
    { date: "2025-09-27", amount: 6_750_000 },
    { date: "2025-08-27", amount: 6_610_000 },
    { date: "2025-06-27", amount: 7_200_000 },
    { date: "2025-04-27", amount: 7_570_000 },
    { date: "2025-03-26", amount: 6_840_000 },
    { date: "2025-02-27", amount: 5_620_000 },
    { date: "2025-02-04", amount: 9_750_000 },
    { date: "2024-12-27", amount: 7_590_000 },
    { date: "2024-11-30", amount: 5_990_000 },
    { date: "2024-11-26", amount: 1_390_000 },
    { date: "2024-09-27", amount: 7_890_000 },
    { date: "2024-08-27", amount: 7_920_000 },
    { date: "2024-07-27", amount: 7_710_000 },
    { date: "2024-06-27", amount: 7_790_000 },
    { date: "2024-05-27", amount: 8_160_000 },
    // Grace period 2022–2023: interest only on full 1.5B balance
    { date: "2023-12-27", amount: 8_400_000 },
    { date: "2023-11-27", amount: 8_400_000 },
    { date: "2023-10-27", amount: 8_400_000 },
    { date: "2023-09-27", amount: 8_400_000 },
    { date: "2023-08-27", amount: 8_400_000 },
    { date: "2023-07-27", amount: 8_400_000 },
    { date: "2023-06-27", amount: 8_400_000 },
    { date: "2023-05-27", amount: 8_400_000 },
    { date: "2023-04-27", amount: 8_400_000 },
    { date: "2023-03-27", amount: 8_400_000 },
    { date: "2023-02-27", amount: 8_400_000 },
    { date: "2023-01-27", amount: 8_400_000 },
    { date: "2022-12-27", amount: 8_400_000 },
    { date: "2022-11-27", amount: 8_400_000 },
    { date: "2022-10-27", amount: 8_400_000 },
    { date: "2022-09-27", amount: 8_400_000 },
    { date: "2022-08-27", amount: 8_400_000 },
    { date: "2022-07-27", amount: 8_400_000 },
  ];

  for (const p of homeLoanInterestPayments) {
    const interestTx = await prisma.transaction.create({
      data: { amount: p.amount, date: d(p.date), description: "Lãi vay VCB", accountId: checking.id, categoryId: interestCat.id, userId: user.id },
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
  const assetPurchaseCat = await prisma.transactionCategory.create({ data: { name: "Asset Purchase", type: "expense", userId: user.id } });
  const assetSaleCat    = await prisma.transactionCategory.create({ data: { name: "Asset Sale",     type: "income",  userId: user.id } });
  void assetSaleCat; // available for sell transactions

  type AssetDef = {
    name: string; type: "real_estate" | "stock" | "bond" | "gold"; currency: "VND" | "USD";
    currentValue: number; purchasePrice: number; purchaseDate: Date;
    quantity?: number; ticker?: string; metadata: Record<string, unknown>;
  };

  const assetDefs: AssetDef[] = [
    {
      name: "Căn hộ Vinhomes Grand Park",
      type: "real_estate", currency: "VND",
      currentValue: 5_200_000_000,
      purchasePrice: 3_000_000_000, // 1.5B loan (50%) + 1.5B own savings (50%)
      purchaseDate: d("2022-06-15"),
      metadata: { address: "Vinhomes Grand Park, Thủ Đức, TP.HCM" },
    },
    {
      name: "Apple (AAPL)",
      type: "stock", currency: "USD",
      currentValue: 2_310,   // 10 shares × $231
      quantity: 10,
      ticker: "AAPL",
      purchasePrice: 1_900,  // 10 shares × $190
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

  // Asset value history — start at purchasePrice, appreciate gradually
  const assetValueSnapshots: Record<string, { date: Date; value: number }[]> = {
    "Căn hộ Vinhomes Grand Park": [
      // 3B → 5.2B over ~3.5 years
      { date: d("2022-09-15"), value: 3_150_000_000 },
      { date: d("2022-12-15"), value: 3_310_000_000 },
      { date: d("2023-03-15"), value: 3_480_000_000 },
      { date: d("2023-06-15"), value: 3_660_000_000 },
      { date: d("2023-09-15"), value: 3_850_000_000 },
      { date: d("2023-12-15"), value: 4_050_000_000 },
      { date: d("2024-03-15"), value: 4_260_000_000 },
      { date: d("2024-06-15"), value: 4_480_000_000 },
      { date: d("2024-09-15"), value: 4_700_000_000 },
      { date: d("2024-12-15"), value: 4_930_000_000 },
      { date: d("2025-03-15"), value: 5_100_000_000 },
      { date: d("2025-06-15"), value: 5_200_000_000 },
    ],
    "Apple (AAPL)": [
      // 10 shares: $190 → $231
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

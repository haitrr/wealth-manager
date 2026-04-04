import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.POSTGRES_PRISMA_URL ?? "postgres://postgres:postgres@localhost:54523/wm";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean up existing seed data
  await prisma.budget.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.loanPayment.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.loan.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.transaction.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.transactionCategory.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.account.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.exchangeRate.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.user.deleteMany({ where: { email: "test@example.com" } });

  const password = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: { email: "test@example.com", password },
  });

  const [checking, savings] = await Promise.all([
    prisma.account.create({
      data: { name: "Tài khoản thanh toán", balance: 10000000, currency: "VND", isDefault: true, userId: user.id },
    }),
    prisma.account.create({
      data: { name: "Tiết kiệm", balance: 50000000, currency: "VND", userId: user.id },
    }),
  ]);

  const categories = await prisma.transactionCategory.createManyAndReturn({
    data: [
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

  const byName = Object.fromEntries(categories.map((c: { id: string; name: string }) => [c.name, c]));

  // Create exchange rates
  await prisma.exchangeRate.createMany({
    data: [
      { fromCurrency: "USD", toCurrency: "VND", rate: 25000, userId: user.id },
      { fromCurrency: "VND", toCurrency: "USD", rate: 0.00004, userId: user.id },
    ],
  });

  const today = new Date();
  const monthDate = (monthOffset: number, day: number) => {
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const lastDayOfMonth = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth() + 1,
      0,
    ).getDate();

    return new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      Math.min(day, lastDayOfMonth),
    );
  };
  const monthNumber = (monthOffset: number) => monthDate(monthOffset, 1).getMonth() + 1;

  await prisma.transaction.createMany({
    data: [
      // Current month
      { amount: 18000000, date: monthDate(0, 1), description: `Lương tháng ${monthNumber(0)}`, accountId: checking.id, categoryId: byName["Lương"].id, userId: user.id },
      { amount: 6000000, date: monthDate(0, 1), description: `Tiền thuê nhà tháng ${monthNumber(0)}`, accountId: checking.id, categoryId: byName["Thuê nhà"].id, userId: user.id },
      { amount: 85000, date: monthDate(0, 1), description: "Cà phê sáng", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 350000, date: monthDate(0, 2), description: "Grab đi làm", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 220000, date: monthDate(0, 2), description: "Bún bò gia đình", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 5000000, date: monthDate(0, 2), description: "Dự án app mobile", accountId: checking.id, categoryId: byName["Freelance"].id, userId: user.id },
      { amount: 670000, date: monthDate(0, 3), description: "Siêu thị Vinmart", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 180000, date: monthDate(0, 3), description: "Xăng xe", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 300000, date: monthDate(0, 3), description: "Cinema CGV", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 95000, date: monthDate(0, 4), description: "Cà phê làm việc", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 480000, date: monthDate(0, 4), description: "Ăn tối với bạn bè", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },

      // Previous month (expanded)
      { amount: 18000000, date: monthDate(-1, 1), description: `Lương tháng ${monthNumber(-1)}`, accountId: checking.id, categoryId: byName["Lương"].id, userId: user.id },
      { amount: 6000000, date: monthDate(-1, 1), description: `Tiền thuê nhà tháng ${monthNumber(-1)}`, accountId: checking.id, categoryId: byName["Thuê nhà"].id, userId: user.id },
      { amount: 650000, date: monthDate(-1, 3), description: "Tiền điện nước", accountId: checking.id, categoryId: byName["Điện nước"].id, userId: user.id },
      { amount: 120000, date: monthDate(-1, 4), description: "Cà phê & bánh mì", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 350000, date: monthDate(-1, 5), description: "Grab tuần 1", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 890000, date: monthDate(-1, 6), description: "Siêu thị Co.opmart", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 8000000, date: monthDate(-1, 7), description: "Dự án thiết kế website", accountId: checking.id, categoryId: byName["Freelance"].id, userId: user.id },
      { amount: 450000, date: monthDate(-1, 8), description: "Ăn trưa văn phòng", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 200000, date: monthDate(-1, 9), description: "Xăng xe", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 180000, date: monthDate(-1, 10), description: "Netflix & Spotify", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 1200000, date: monthDate(-1, 11), description: "Mua thực phẩm tuần 2", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 850000, date: monthDate(-1, 12), description: "Ăn tối nhà hàng", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 450000, date: monthDate(-1, 13), description: "Grab tuần 2", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 3000000, date: monthDate(-1, 14), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: byName["Thẻ tín dụng"].id, userId: user.id },
      { amount: 75000, date: monthDate(-1, 15), description: "Trà sữa", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 560000, date: monthDate(-1, 16), description: "Siêu thị tuần 3", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 300000, date: monthDate(-1, 17), description: "Coi phim rạp", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 420000, date: monthDate(-1, 18), description: "Ăn sáng & cà phê cả tuần", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 2000000, date: monthDate(-1, 19), description: "Bạn trả nợ", accountId: savings.id, categoryId: byName["Cho vay"].id, userId: user.id },
      { amount: 350000, date: monthDate(-1, 20), description: "Grab tuần 3", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 1100000, date: monthDate(-1, 21), description: "Mua thực phẩm tuần 3", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 250000, date: monthDate(-1, 22), description: "Bia bạn bè cuối tuần", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 95000, date: monthDate(-1, 23), description: "Cà phê sáng", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 200000, date: monthDate(-1, 24), description: "Xăng xe tuần 4", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 700000, date: monthDate(-1, 25), description: "Ăn tối sinh nhật bạn", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 1000000, date: monthDate(-1, 26), description: "Siêu thị tuần 4", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 80000, date: monthDate(-1, 27), description: "Vé xe buýt tháng", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 3000000, date: monthDate(-1, 28), description: "Freelance UI design", accountId: checking.id, categoryId: byName["Freelance"].id, userId: user.id },
      { amount: 420000, date: monthDate(-1, 29), description: "Grab cuối tháng", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 180000, date: monthDate(-1, 30), description: "Ăn vặt cuối tháng", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 500000, date: monthDate(-1, 31), description: "Mua sách online", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },

      // Two months ago
      { amount: 18000000, date: monthDate(-2, 1), description: `Lương tháng ${monthNumber(-2)}`, accountId: checking.id, categoryId: byName["Lương"].id, userId: user.id },
      { amount: 6000000, date: monthDate(-2, 1), description: `Tiền thuê nhà tháng ${monthNumber(-2)}`, accountId: checking.id, categoryId: byName["Thuê nhà"].id, userId: user.id },
      { amount: 600000, date: monthDate(-2, 3), description: `Tiền điện nước tháng ${monthNumber(-2)}`, accountId: checking.id, categoryId: byName["Điện nước"].id, userId: user.id },
      { amount: 1500000, date: monthDate(-2, 4), description: "Tết sắm đồ", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 2000000, date: monthDate(-2, 5), description: "Lì xì Tết", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 1800000, date: monthDate(-2, 8), description: "Ăn uống dịp Tết", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 400000, date: monthDate(-2, 10), description: "Xăng đi chơi Tết", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 6000000, date: monthDate(-2, 12), description: "Dự án freelance backend", accountId: checking.id, categoryId: byName["Freelance"].id, userId: user.id },
      { amount: 750000, date: monthDate(-2, 14), description: "Valentine dinner", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 3500000, date: monthDate(-2, 15), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: byName["Thẻ tín dụng"].id, userId: user.id },
      { amount: 980000, date: monthDate(-2, 18), description: "Siêu thị tuần 3", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 350000, date: monthDate(-2, 20), description: `Grab tháng ${monthNumber(-2)}`, accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 180000, date: monthDate(-2, 22), description: "Netflix & Spotify", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 620000, date: monthDate(-2, 25), description: "Ăn uống cuối tuần", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 200000, date: monthDate(-2, 28), description: "Xăng xe cuối tháng", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },

      // Three months ago
      { amount: 18000000, date: monthDate(-3, 1), description: `Lương tháng ${monthNumber(-3)}`, accountId: checking.id, categoryId: byName["Lương"].id, userId: user.id },
      { amount: 6000000, date: monthDate(-3, 1), description: `Tiền thuê nhà tháng ${monthNumber(-3)}`, accountId: checking.id, categoryId: byName["Thuê nhà"].id, userId: user.id },
      { amount: 580000, date: monthDate(-3, 4), description: `Tiền điện nước tháng ${monthNumber(-3)}`, accountId: checking.id, categoryId: byName["Điện nước"].id, userId: user.id },
      { amount: 4000000, date: monthDate(-3, 5), description: `Freelance tháng ${monthNumber(-3)}`, accountId: checking.id, categoryId: byName["Freelance"].id, userId: user.id },
      { amount: 900000, date: monthDate(-3, 8), description: "Siêu thị tuần 1", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 350000, date: monthDate(-3, 10), description: "Grab đi làm", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 3000000, date: monthDate(-3, 15), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: byName["Thẻ tín dụng"].id, userId: user.id },
      { amount: 180000, date: monthDate(-3, 18), description: "Netflix & Spotify", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 750000, date: monthDate(-3, 20), description: "Ăn tối cuối tuần", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 200000, date: monthDate(-3, 22), description: "Xăng xe", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 1200000, date: monthDate(-3, 25), description: "Siêu thị tuần 4", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 500000, date: monthDate(-3, 28), description: "Bia bạn bè", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 400000, date: monthDate(-3, 30), description: "Grab cuối tháng", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
    ],
  });

  const monthStart = monthDate(-1, 1);

  await prisma.budget.createMany({
    data: [
      { name: "Ăn uống hàng tháng", amount: 4000000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [byName["Ăn uống"].id], userId: user.id },
      { name: "Đi lại", amount: 1500000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [byName["Đi lại"].id], userId: user.id },
      { name: "Giải trí", amount: 1000000, currency: "VND", period: "monthly", startDate: monthStart, categoryIds: [byName["Giải trí"].id], userId: user.id },
      { name: "Chi tiêu tổng", amount: 15000000, currency: "VND", period: "monthly", startDate: monthStart, userId: user.id },
      { name: "Chi tiêu tài khoản chính", amount: 12000000, currency: "VND", period: "monthly", startDate: monthStart, accountId: checking.id, userId: user.id },
    ],
  });

  // Seed loans
  const loanReceivedCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Received", type: "income", userId: user.id },
  });
  const loanGivenCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Given", type: "expense", userId: user.id },
  });

  const homeLoanInitialTx = await prisma.transaction.create({
    data: {
      amount: 2000_000_000,
      date: new Date("2024-01-26"),
      description: "Vay mua nhà - initial",
      accountId: checking.id,
      categoryId: loanReceivedCategory.id,
      userId: user.id,
    },
  });

  const homeLoan = await prisma.loan.create({
    data: {
      name: "Vay mua nhà",
      direction: "borrowed",
      currency: "VND",
      startDate: new Date("2024-01-26"),
      counterpartyName: "Vietcombank",
      notes: "Vay mua căn hộ chung cư",
      status: "active",
      accountId: checking.id,
      initialTransactionId: homeLoanInitialTx.id,
      userId: user.id,
    },
  });

  // Loan Repayment & Prepay Fee categories
  const repayCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Repayment", type: "expense", userId: user.id },
  });
  const prepayFeeCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Prepay Fee", type: "expense", userId: user.id },
  });
  const interestCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Interest", type: "expense", userId: user.id },
  });
  const homeLoanPayments = [
    { date: "2026-04-01", amount: 200_000_000, note: "Repayment Apr 1, 2026" },
    { date: "2026-02-04", amount: 100_000_000, note: "Repayment Feb 4, 2026" },
    { date: "2026-01-15", amount: 100_000_000, note: "Debt paid to VCB Jan 15, 2026" },
    { date: "2026-01-08", amount: 100_000_000, note: "Debt paid to VCB Jan 8, 2026" },
    { date: "2025-12-07", amount: 100_000_000, note: "Debt paid to VCB Dec 7, 2025" },
    { date: "2025-11-23", amount: 200_000_000, note: "Repayment Nov 23, 2025" },
    { date: "2025-11-20", amount: 50_000_000, note: "Repayment Nov 20, 2025" },
    { date: "2025-11-10", amount: 50_000_000, note: "Debt paid to VCB Nov 10, 2025" },
    { date: "2025-09-25", amount: 50_000_000, note: "Debt paid to VCB Sep 25, 2025" },
    { date: "2025-08-24", amount: 30_000_000, note: "Debt paid to VCB Aug 24, 2025" },
    { date: "2025-07-30", amount: 20_000_000, note: "Debt paid to VCB Jul 30, 2025" },
    { date: "2025-06-04", amount: 45_000_000, note: "Debt paid to VCB Jun 4, 2025" },
    { date: "2025-05-14", amount: 30_000_000, note: "Debt paid to VCB May 14, 2025" },
    { date: "2025-05-10", amount: 25_000_000, note: "Debt paid to VCB May 10, 2025" },
    { date: "2025-02-05", amount: 36_000_000, note: "Debt paid to VCB Feb 5, 2025" },
    { date: "2025-01-03", amount: 30_000_000, note: "Debt paid to VCB Jan 3, 2025" },
    { date: "2024-11-20", amount: 10_000_000, note: "Debt paid to VCB Nov 20, 2024" },
    { date: "2024-08-19", amount: 10_000_000, note: "Debt paid to VCB Aug 19, 2024" },
    { date: "2024-07-20", amount: 10_000_000, note: "Debt paid to VCB Jul 20, 2024" },
    { date: "2024-06-19", amount: 20_000_000, note: "Debt paid to VCB Jun 19, 2024" },
    { date: "2024-06-03", amount: 10_000_000, note: "Debt paid to VCB Jun 3, 2024" },
    { date: "2024-05-31", amount: 10_000_000, note: "Debt paid to VCB May 31, 2024" },
    { date: "2024-05-09", amount: 10_000_000, note: "Debt paid to VCB May 9, 2024" },
    { date: "2024-04-19", amount: 10_000_000, note: "Debt paid to VCB Apr 19, 2024" },
    { date: "2024-04-05", amount: 12_000_000, note: "Debt paid to VCB Apr 5, 2024" },
    { date: "2024-03-24", amount: 10_000_000, note: "Repayment Mar 24, 2024" },
    { date: "2024-02-28", amount: 12_000_000, note: "Debt paid to VCB Feb 28, 2024" },
  ];

  for (const p of homeLoanPayments) {
    const principalTx = await prisma.transaction.create({
      data: {
        amount: p.amount,
        date: new Date(p.date),
        description: p.note,
        accountId: checking.id,
        categoryId: repayCategory.id,
        userId: user.id,
      },
    });
    const prepayFeeTx = await prisma.transaction.create({
      data: {
        amount: Math.round(p.amount * 0.01),
        date: new Date(p.date),
        description: `${p.note} - prepay fee`,
        accountId: checking.id,
        categoryId: prepayFeeCategory.id,
        userId: user.id,
      },
    });
    await prisma.loanPayment.create({
      data: {
        loanId: homeLoan.id,
        accountId: checking.id,
        paymentDate: new Date(p.date),
        principalTransactionId: principalTx.id,
        prepayFeeTransactionId: prepayFeeTx.id,
        note: p.note,
        userId: user.id,
      },
    });
  }

  const homeLoanInterestPayments = [
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
  ];

  for (const p of homeLoanInterestPayments) {
    const interestTx = await prisma.transaction.create({
      data: {
        amount: p.amount,
        date: new Date(p.date),
        description: "Loan interest",
        accountId: checking.id,
        categoryId: interestCategory.id,
        userId: user.id,
      },
    });
    await prisma.loanPayment.create({
      data: {
        loanId: homeLoan.id,
        accountId: checking.id,
        paymentDate: new Date(p.date),
        interestTransactionId: interestTx.id,
        note: "Loan interest",
        userId: user.id,
      },
    });
  }

  const lentLoanInitialTx = await prisma.transaction.create({
    data: {
      amount: 10000000,
      date: new Date("2025-12-01"),
      description: "Cho bạn vay - initial",
      accountId: savings.id,
      categoryId: loanGivenCategory.id,
      userId: user.id,
    },
  });

  await prisma.loan.create({
    data: {
      name: "Cho bạn vay",
      direction: "lent",
      currency: "VND",
      startDate: new Date("2025-12-01"),
      counterpartyName: "Nguyễn Văn A",
      status: "active",
      accountId: savings.id,
      initialTransactionId: lentLoanInitialTx.id,
      userId: user.id,
    },
  });

  console.log("Seed complete.");
  console.log("  Email:    test@example.com");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

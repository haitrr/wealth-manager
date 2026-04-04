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
      { name: "Thẻ tín dụng", type: "payable", userId: user.id },
      { name: "Cho vay", type: "receivable", userId: user.id },
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

  const now = new Date("2026-03-14");
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);

  await prisma.transaction.createMany({
    data: [
      { amount: 18000000, date: d(13), description: "Lương tháng 3", accountId: checking.id, categoryId: byName["Lương"].id, userId: user.id },
      { amount: 8000000, date: d(10), description: "Dự án thiết kế website", accountId: checking.id, categoryId: byName["Freelance"].id, userId: user.id },
      { amount: 6000000, date: d(9), description: "Tiền thuê nhà tháng 3", accountId: checking.id, categoryId: byName["Thuê nhà"].id, userId: user.id },
      { amount: 650000, date: d(8), description: "Tiền điện nước", accountId: checking.id, categoryId: byName["Điện nước"].id, userId: user.id },
      { amount: 1200000, date: d(7), description: "Mua thực phẩm", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 450000, date: d(6), description: "Grab đi làm", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
      { amount: 180000, date: d(5), description: "Netflix & Spotify", accountId: checking.id, categoryId: byName["Giải trí"].id, userId: user.id },
      { amount: 850000, date: d(4), description: "Ăn tối nhà hàng", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 3000000, date: d(3), description: "Thanh toán thẻ tín dụng", accountId: checking.id, categoryId: byName["Thẻ tín dụng"].id, userId: user.id },
      { amount: 2000000, date: d(2), description: "Bạn trả nợ", accountId: savings.id, categoryId: byName["Cho vay"].id, userId: user.id },
      { amount: 120000, date: d(1), description: "Cà phê & ăn vặt", accountId: checking.id, categoryId: byName["Ăn uống"].id, userId: user.id },
      { amount: 80000, date: d(0), description: "Vé xe buýt tháng", accountId: checking.id, categoryId: byName["Đi lại"].id, userId: user.id },
    ],
  });

  const monthStart = new Date("2026-03-01");

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
  const homeLoan = await prisma.loan.create({
    data: {
      name: "Vay mua nhà",
      direction: "borrowed",
      principalAmount: 2000_000_000,
      currency: "VND",
      startDate: new Date("2024-01-26"),
      counterpartyName: "Vietcombank",
      notes: "Vay mua căn hộ chung cư",
      status: "active",
      accountId: checking.id,
      userId: user.id,
    },
  });

  // Loan Repayment category
  const repayCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Repayment", type: "payable", userId: user.id },
  });
  const interestCategory = await prisma.transactionCategory.create({
    data: { name: "Loan Interest", type: "expense", userId: user.id },
  });

  const principalTx = await prisma.transaction.create({
    data: { amount: 2500000, date: new Date("2026-03-15"), description: "Vay mua nhà - principal", accountId: checking.id, categoryId: repayCategory.id, userId: user.id },
  });
  const interestTx = await prisma.transaction.create({
    data: { amount: 5845000, date: new Date("2026-03-15"), description: "Vay mua nhà - interest", accountId: checking.id, categoryId: interestCategory.id, userId: user.id },
  });

  await prisma.loanPayment.create({
    data: {
      loanId: homeLoan.id,
      accountId: checking.id,
      paymentDate: new Date("2026-03-15"),
      principalAmount: 2500000,
      interestAmount: 5845000,
      prepayFeeAmount: 0,
      principalTransactionId: principalTx.id,
      interestTransactionId: interestTx.id,
      note: "Trả góp tháng 3/2026",
      userId: user.id,
    },
  });

  await prisma.loan.create({
    data: {
      name: "Cho bạn vay",
      direction: "lent",
      principalAmount: 10000000,
      currency: "VND",
      startDate: new Date("2025-12-01"),
      counterpartyName: "Nguyễn Văn A",
      status: "active",
      accountId: savings.id,
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

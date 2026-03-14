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
  await prisma.transaction.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.transactionCategory.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.account.deleteMany({ where: { user: { email: "test@example.com" } } });
  await prisma.user.deleteMany({ where: { email: "test@example.com" } });

  const password = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: { email: "test@example.com", password },
  });

  const [checking, savings] = await Promise.all([
    prisma.account.create({
      data: { name: "Checking", balance: 5000, isDefault: true, userId: user.id },
    }),
    prisma.account.create({
      data: { name: "Savings", balance: 20000, userId: user.id },
    }),
  ]);

  const categories = await prisma.transactionCategory.createManyAndReturn({
    data: [
      { name: "Salary", type: "income", userId: user.id },
      { name: "Freelance", type: "income", userId: user.id },
      { name: "Food & Dining", type: "expense", userId: user.id },
      { name: "Transport", type: "expense", userId: user.id },
      { name: "Utilities", type: "expense", userId: user.id },
      { name: "Entertainment", type: "expense", userId: user.id },
      { name: "Rent", type: "expense", userId: user.id },
      { name: "Credit Card", type: "payable", userId: user.id },
      { name: "Loan", type: "receivable", userId: user.id },
    ],
  });

  const byName = Object.fromEntries(categories.map((c) => [c.name, c]));

  const now = new Date("2026-03-14");
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);

  await prisma.transaction.createMany({
    data: [
      {
        amount: 5000,
        date: d(13),
        description: "March salary",
        accountId: checking.id,
        categoryId: byName["Salary"].id,
        userId: user.id,
      },
      {
        amount: 800,
        date: d(10),
        description: "Website project",
        accountId: checking.id,
        categoryId: byName["Freelance"].id,
        userId: user.id,
      },
      {
        amount: 1200,
        date: d(9),
        description: "Monthly rent",
        accountId: checking.id,
        categoryId: byName["Rent"].id,
        userId: user.id,
      },
      {
        amount: 85,
        date: d(8),
        description: "Electricity & water",
        accountId: checking.id,
        categoryId: byName["Utilities"].id,
        userId: user.id,
      },
      {
        amount: 45,
        date: d(7),
        description: "Groceries",
        accountId: checking.id,
        categoryId: byName["Food & Dining"].id,
        userId: user.id,
      },
      {
        amount: 32,
        date: d(6),
        description: "Grab rides",
        accountId: checking.id,
        categoryId: byName["Transport"].id,
        userId: user.id,
      },
      {
        amount: 60,
        date: d(5),
        description: "Netflix & Spotify",
        accountId: checking.id,
        categoryId: byName["Entertainment"].id,
        userId: user.id,
      },
      {
        amount: 120,
        date: d(4),
        description: "Restaurant dinner",
        accountId: checking.id,
        categoryId: byName["Food & Dining"].id,
        userId: user.id,
      },
      {
        amount: 500,
        date: d(3),
        description: "Credit card payment",
        accountId: checking.id,
        categoryId: byName["Credit Card"].id,
        userId: user.id,
      },
      {
        amount: 300,
        date: d(2),
        description: "Friend loan repayment",
        accountId: savings.id,
        categoryId: byName["Loan"].id,
        userId: user.id,
      },
      {
        amount: 25,
        date: d(1),
        description: "Coffee & snacks",
        accountId: checking.id,
        categoryId: byName["Food & Dining"].id,
        userId: user.id,
      },
      {
        amount: 18,
        date: d(0),
        description: "Bus pass",
        accountId: checking.id,
        categoryId: byName["Transport"].id,
        userId: user.id,
      },
    ],
  });

  const monthStart = new Date("2026-03-01");

  await prisma.budget.createMany({
    data: [
      {
        name: "Monthly Food",
        amount: 400,
        period: "monthly",
        startDate: monthStart,
        categoryId: byName["Food & Dining"].id,
        userId: user.id,
      },
      {
        name: "Transport",
        amount: 100,
        period: "monthly",
        startDate: monthStart,
        categoryId: byName["Transport"].id,
        userId: user.id,
      },
      {
        name: "Entertainment",
        amount: 80,
        period: "monthly",
        startDate: monthStart,
        categoryId: byName["Entertainment"].id,
        userId: user.id,
      },
      {
        name: "All Expenses",
        amount: 2500,
        period: "monthly",
        startDate: monthStart,
        userId: user.id,
      },
      {
        name: "Checking Spending",
        amount: 2000,
        period: "monthly",
        startDate: monthStart,
        accountId: checking.id,
        userId: user.id,
      },
    ],
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

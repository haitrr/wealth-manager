import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

interface CsvRow {
  date: string;
  category: string;
  amount: number;
  currency: string;
  wallet: string;
  note: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  // Skip header row
  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        cols.push(current);
        current = "";
      } else {
        current += line[i];
      }
    }
    cols.push(current);

    // CSV: Id,Date,Category,Amount,Currency,Wallet,Note,...
    const [, date, category, amountStr, currency, wallet, note] = cols;
    return {
      date: date?.trim() ?? "",
      category: category?.trim() ?? "",
      amount: parseFloat(amountStr ?? "0"),
      currency: currency?.trim() ?? "VND",
      wallet: wallet?.trim() ?? "",
      note: note?.trim() ?? "",
    };
  });
}

function parseMlDate(dateStr: string): Date {
  // Format: DD/MM/YYYY
  const [day, month, year] = dateStr.split("/");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text).filter((r) => r.date && !isNaN(r.amount) && r.category);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
  }

  // Load existing categories and accounts for this user
  const [existingCategories, existingAccounts] = await Promise.all([
    prisma.transactionCategory.findMany({ where: { userId: session.userId } }),
    prisma.account.findMany({ where: { userId: session.userId } }),
  ]);

  const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]));
  const accountMap = new Map(existingAccounts.map((a) => [a.name.toLowerCase(), a]));

  // Collect unique categories and wallets to create
  const uniqueCategories = new Map<string, "income" | "expense">();
  const uniqueWallets = new Map<string, string>(); // name -> currency

  for (const row of rows) {
    const catKey = row.category.toLowerCase();
    if (!categoryMap.has(catKey) && !uniqueCategories.has(catKey)) {
      uniqueCategories.set(catKey, row.amount >= 0 ? "income" : "expense");
    }
    const walletKey = row.wallet.toLowerCase();
    if (!accountMap.has(walletKey) && !uniqueWallets.has(walletKey)) {
      const currency = row.currency.toUpperCase() === "USD" ? "USD" : "VND";
      uniqueWallets.set(walletKey, currency);
    }
  }

  // Create missing categories
  if (uniqueCategories.size > 0) {
    const created = await prisma.$transaction(
      Array.from(uniqueCategories.entries()).map(([name, type]) =>
        prisma.transactionCategory.create({
          data: {
            name: rows.find((r) => r.category.toLowerCase() === name)?.category ?? name,
            type,
            userId: session.userId,
          },
        })
      )
    );
    for (const cat of created) {
      categoryMap.set(cat.name.toLowerCase(), cat);
    }
  }

  // Create missing accounts/wallets
  if (uniqueWallets.size > 0) {
    const created = await prisma.$transaction(
      Array.from(uniqueWallets.entries()).map(([walletKey, currency]) => {
        const originalName =
          rows.find((r) => r.wallet.toLowerCase() === walletKey)?.wallet ?? walletKey;
        return prisma.account.create({
          data: {
            name: originalName,
            currency: currency as "USD" | "VND",
            balance: 0,
            userId: session.userId,
          },
        });
      })
    );
    for (const acc of created) {
      accountMap.set(acc.name.toLowerCase(), acc);
    }
  }

  // Build transaction data
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const transactionData: {
    amount: number;
    date: Date;
    description: string | null;
    accountId: string;
    categoryId: string;
    userId: string;
  }[] = [];

  for (const row of rows) {
    const category = categoryMap.get(row.category.toLowerCase());
    const account = accountMap.get(row.wallet.toLowerCase());

    if (!category || !account) {
      errors.push(`Row skipped: could not resolve category "${row.category}" or wallet "${row.wallet}"`);
      skipped++;
      continue;
    }

    try {
      const date = parseMlDate(row.date);
      if (isNaN(date.getTime())) {
        errors.push(`Row skipped: invalid date "${row.date}"`);
        skipped++;
        continue;
      }

      transactionData.push({
        amount: Math.abs(row.amount),
        date,
        description: row.note || null,
        accountId: account.id,
        categoryId: category.id,
        userId: session.userId,
      });
      imported++;
    } catch {
      errors.push(`Row skipped: error processing row for "${row.category}" on "${row.date}"`);
      skipped++;
    }
  }

  // Bulk insert in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < transactionData.length; i += BATCH_SIZE) {
    await prisma.transaction.createMany({
      data: transactionData.slice(i, i + BATCH_SIZE),
    });
  }

  return NextResponse.json({
    imported,
    skipped,
    errors: errors.slice(0, 10),
  });
}

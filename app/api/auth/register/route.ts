import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/db";
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  await prisma.transactionCategory.createMany({
    data: [
      { name: "Salary", type: "income", userId: user.id },
      { name: "Freelance", type: "income", userId: user.id },
      { name: "Investment", type: "income", userId: user.id },
      { name: "Food & Dining", type: "expense", userId: user.id },
      { name: "Transport", type: "expense", userId: user.id },
      { name: "Shopping", type: "expense", userId: user.id },
      { name: "Bills & Utilities", type: "expense", userId: user.id },
      { name: "Health", type: "expense", userId: user.id },
      { name: "Entertainment", type: "expense", userId: user.id },
      { name: "Borrowed Money", type: "expense", userId: user.id },
      { name: "Lent Money", type: "income", userId: user.id },
    ],
  });

  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({ user: { id: user.id, email: user.email } });
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return response;
}

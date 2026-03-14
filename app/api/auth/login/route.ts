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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({ user: { id: user.id, email: user.email } });
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return response;
}

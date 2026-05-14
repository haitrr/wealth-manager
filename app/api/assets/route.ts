import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { parseAssetPayload, AssetPayload } from "./asset-route-utils";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await prisma.asset.findMany({
    where: { userId: session.userId },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = parseAssetPayload(await req.json() as AssetPayload);
    const asset = await prisma.asset.create({
      data: { ...parsed, userId: session.userId },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create asset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

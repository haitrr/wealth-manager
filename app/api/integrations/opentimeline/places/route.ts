import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ places: [] });

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.userId } });
  if (!settings?.openTimelineUrl) {
    return NextResponse.json({ places: [] });
  }

  try {
    const url = new URL("/api/places", settings.openTimelineUrl);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json({ places: [] });

    const data: { places?: { id: number; name: string }[] } = await res.json();
    const places = (data.places ?? []).map((p) => ({ id: String(p.id), name: p.name }));
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}

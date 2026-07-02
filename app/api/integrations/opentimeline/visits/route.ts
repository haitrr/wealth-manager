import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const at = req.nextUrl.searchParams.get("at");
  if (!at) return NextResponse.json({ error: "at parameter required" }, { status: 400 });

  const atDate = new Date(at);
  if (isNaN(atDate.getTime())) {
    return NextResponse.json({ error: "Invalid at parameter" }, { status: 400 });
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.userId } });
  if (!settings?.openTimelineUrl) {
    return NextResponse.json(null);
  }

  // Query the full UTC day so partial-day visits overlapping the transaction are included
  const dayStart = new Date(atDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(atDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  try {
    const url = new URL("/api/visits", settings.openTimelineUrl);
    url.searchParams.set("start", dayStart.toISOString());
    url.searchParams.set("end", dayEnd.toISOString());
    url.searchParams.set("status", "confirmed");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json(null);

    const visits: { placeId?: number; place?: { id: number; name: string } }[] = await res.json();
    if (!Array.isArray(visits) || visits.length === 0) return NextResponse.json(null);

    const first = visits[0];
    const placeId = first.place?.id ?? first.placeId;
    const placeName = first.place?.name;
    if (placeId == null || !placeName) return NextResponse.json(null);

    return NextResponse.json({ placeId: String(placeId), placeName });
  } catch {
    return NextResponse.json(null);
  }
}

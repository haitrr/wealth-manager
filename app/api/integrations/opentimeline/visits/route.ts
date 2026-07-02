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
    return NextResponse.json({ places: [] });
  }

  // Query the full UTC day so all visits overlapping the transaction date are included
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
    if (!res.ok) return NextResponse.json({ places: [] });

    const visits: { placeId?: number; place?: { id: number; name: string } }[] = await res.json();
    if (!Array.isArray(visits)) return NextResponse.json({ places: [] });

    // Collect every visited place for the day, de-duplicated, preserving arrival order
    const seen = new Set<string>();
    const places: { id: string; name: string }[] = [];
    for (const v of visits) {
      const id = v.place?.id ?? v.placeId;
      const name = v.place?.name;
      if (id == null || !name) continue;
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
      places.push({ id: key, name });
    }

    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}

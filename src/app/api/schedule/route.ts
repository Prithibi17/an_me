import { NextResponse } from "next/server";
import { getAiringSchedule } from "@/lib/anilist/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") ? Number(searchParams.get("start")) : undefined;
    const end = searchParams.get("end") ? Number(searchParams.get("end")) : undefined;

    const data = await getAiringSchedule(start, end, 100);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch schedule" }, { status: 500 });
  }
}

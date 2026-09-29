import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/server";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout failed", error);
    return NextResponse.json({ error: "Could not log out." }, { status: 500 });
  }
}

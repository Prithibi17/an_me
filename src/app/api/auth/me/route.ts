import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { ensureSchema, getDb } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ user: await getSessionUser() });
  } catch (error) {
    console.error("Session lookup failed", error);
    return NextResponse.json({ error: "Database connection failed." }, { status: 500 });
  }
}


const ALLOWED_AVATARS = new Set([
  "🌸", "⚔️", "👒", "🔥", "🐉", "🧣", "🤞", "🗡️",
  "🐱", "🦊", "🐼", "🐧", "🌙", "⭐", "🎮", "🎧",
]);

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const body = await request.json();
    const avatar = typeof body.avatar === "string" ? body.avatar.trim() : "";
    if (!ALLOWED_AVATARS.has(avatar)) {
      return NextResponse.json({ error: "Invalid avatar selection." }, { status: 400 });
    }

    await ensureSchema();
    await getDb().execute({
      sql: "UPDATE users SET avatar = ? WHERE id = ?",
      args: [avatar, user.id],
    });
    return NextResponse.json({ user: { ...user, avatar } });
  } catch (error) {
    console.error("Avatar update failed", error);
    return NextResponse.json({ error: "Could not update avatar." }, { status: 500 });
  }
}

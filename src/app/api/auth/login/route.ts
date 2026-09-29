import { NextResponse } from "next/server";
import { createSession, normalizeUser, verifyPassword } from "@/lib/auth/server";
import { ensureSchema, getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");
    if (!identifier || !password)
      return NextResponse.json({ error: "Enter your email or username and password." }, { status: 400 });
    await ensureSchema();
    const result = await getDb().execute({
      sql: "SELECT id, username, email, avatar, is_vip, created_at, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1",
      args: [identifier, identifier.toLowerCase()],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row || !(await verifyPassword(password, String(row.password_hash))))
      return NextResponse.json({ error: "Invalid email/username or password." }, { status: 401 });
    await createSession(String(row.id));
    return NextResponse.json({ user: normalizeUser(row) });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Database connection failed. Check the Turso environment variables." }, { status: 500 });
  }
}

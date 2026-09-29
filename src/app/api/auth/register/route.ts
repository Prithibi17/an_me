import { NextResponse } from "next/server";
import { createSession, hashPassword, normalizeUser, randomUUID } from "@/lib/auth/server";
import { ensureSchema, getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
      return NextResponse.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    await ensureSchema();
    const existing = await getDb().execute({
      sql: "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      args: [username, email],
    });
    if (existing.rows.length)
      return NextResponse.json({ error: "That username or email is already registered." }, { status: 409 });

    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    await getDb().execute({
      sql: "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)",
      args: [id, username, email, passwordHash],
    });
    await createSession(id);
    const result = await getDb().execute({
      sql: "SELECT id, username, email, avatar, is_vip, created_at FROM users WHERE id = ?",
      args: [id],
    });
    return NextResponse.json({ user: normalizeUser(result.rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Database connection failed. Check the Turso environment variables." }, { status: 500 });
  }
}

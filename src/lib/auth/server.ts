import "server-only";

import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ensureSchema, getDb } from "@/lib/db";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "kumo_session";
const SESSION_DAYS = 30;

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isVip: boolean;
  joinedAt: string;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function normalizeUser(row: Record<string, unknown>): PublicUser {
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    avatar: String(row.avatar || ""),
    isVip: Boolean(row.is_vip),
    joinedAt: new Date(String(row.created_at)).toLocaleDateString("en", {
      month: "short",
      year: "numeric",
    }),
  };
}

export async function createSession(userId: string) {
  await ensureSchema();
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await getDb().execute({
    sql: "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    args: [id, userId, expires.toISOString()],
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function getSessionUser(): Promise<PublicUser | null> {
  await ensureSchema();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await getDb().execute({
    sql: `SELECT u.id, u.username, u.email, u.avatar, u.is_vip, u.created_at
          FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP`,
    args: [token],
  });
  return result.rows[0] ? normalizeUser(result.rows[0] as Record<string, unknown>) : null;
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureSchema();
    await getDb().execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [token] });
  }
  store.delete(SESSION_COOKIE);
}

export { randomUUID };

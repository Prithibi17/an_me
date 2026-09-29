import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";

const secret = process.env.WATCH_TOGETHER_SECRET || "anme-watch-together-local-secret";
const encode = (value: string) => Buffer.from(value).toString("base64url");

export async function GET() {
  const user = await getSessionUser();
  const identity = {
    id: user ? `user:${user.id}` : `guest:${randomUUID()}`,
    name: user?.username || `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: user?.avatar || "👤",
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  const payload = encode(JSON.stringify(identity));
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return NextResponse.json({ token: `${payload}.${signature}`, identity });
}

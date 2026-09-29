export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isVip?: boolean;
  joinedAt: string;
}

const STORAGE_KEY = "kumo_user_profile";
const AUTH_EVENT = "kumo_auth_change";

function storeUser(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function authRequest(path: string, body: object): Promise<UserProfile> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Authentication failed.");
  storeUser(data.user);
  return data.user;
}

export function loginUser(identifier: string, password: string) {
  return authRequest("/api/auth/login", { identifier, password });
}

export function registerUser(username: string, email: string, password: string) {
  return authRequest("/api/auth/register", { username, email, password });
}

export function updateAvatar(avatar: string) {
  return authRequest("/api/auth/me", { avatar });
}

export async function refreshCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json();
    const user = response.ok ? data.user || null : null;
    storeUser(user);
    return user;
  } catch {
    return getCurrentUser();
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    storeUser(null);
  }
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => {
    callback(getCurrentUser());
  };

  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

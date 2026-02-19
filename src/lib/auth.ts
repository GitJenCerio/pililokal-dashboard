import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "pililokal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Session = {
  userId: string;
  email: string;
  name: string;
};

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const { userId } = JSON.parse(sessionCookie.value);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

export function createSessionCookie(session: Session): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(JSON.stringify({ userId: session.userId }))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export async function logout(): Promise<void> {
  "use server";
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

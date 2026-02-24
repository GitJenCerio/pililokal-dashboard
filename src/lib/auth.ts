import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { sealSession, unsealSession, SESSION_COOKIE, SESSION_MAX_AGE } from "./session";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
};

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  const data = await unsealSession(sessionCookie.value);
  if (!data?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });
  if (!user) return null;
  if (!user.isActive) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  };
}

export async function login(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  };
}

/** Returns the sealed cookie value to set for the session. */
export async function createSessionCookie(session: Session): Promise<string> {
  return sealSession({ userId: session.userId });
}

export async function logout(): Promise<void> {
  "use server";
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE, SESSION_MAX_AGE };

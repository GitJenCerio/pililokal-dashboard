import { getServerSession as getNextAuthSession } from "next-auth";
import { authOptions } from "./auth-config";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { sealSession, SESSION_COOKIE, SESSION_MAX_AGE } from "./session";

export { SESSION_COOKIE, SESSION_MAX_AGE };

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
};

export async function getServerSession(): Promise<Session | null> {
  const session = await getNextAuthSession(authOptions);
  if (!session?.user) return null;
  const u = session.user;
  if (!u.id || !u.email) return null;
  if (u.isActive === false) return null;
  return {
    userId: u.id,
    email: u.email,
    name: u.name ?? "",
    role: u.role ?? "VIEWER",
    isActive: u.isActive ?? true,
  };
}

export async function logout(): Promise<void> {
  "use server";
  const { redirect } = await import("next/navigation");
  redirect("/api/auth/signout?callbackUrl=/");
}

export async function login(
  email: string,
  password: string
): Promise<{ userId: string; email: string; name: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user?.passwordHash || !user.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { userId: user.id, email: user.email, name: user.name };
}

export async function createSessionCookie(session: {
  userId: string;
}): Promise<string> {
  return sealSession({ userId: session.userId });
}

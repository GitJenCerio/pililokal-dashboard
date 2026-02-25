import { getServerSession as getNextAuthSession } from "next-auth";
import { authOptions } from "./auth-config";

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

"use server";

import { redirect } from "next/navigation";
import { login, createSessionCookie, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const session = await login(email, password);
  if (!session) {
    return { error: "Invalid email or password" };
  }

  const sealedValue = await createSessionCookie(session);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sealedValue, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/dashboard");
}

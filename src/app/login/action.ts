"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { createSessionCookie } from "@/lib/auth";
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

  const cookieStore = await cookies();
  cookieStore.set("pililokal_session", JSON.stringify({ userId: session.userId }), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

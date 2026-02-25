"use server";

import { redirect } from "next/navigation";

export async function logoutAction() {
  redirect("/api/auth/signout?callbackUrl=/");
}

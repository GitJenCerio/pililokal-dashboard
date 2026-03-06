"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function resetPasswordAction(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!token || !password) return { error: "Token and password are required" };
  if (password !== confirm) return { error: "Passwords do not match" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) return { error: "Invalid or expired reset link. Please request a new one." };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  redirect("/?reset=success");
}

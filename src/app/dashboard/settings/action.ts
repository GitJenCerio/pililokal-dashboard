"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function changePasswordAction(formData: FormData) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  const current = formData.get("currentPassword") as string;
  const newPass = formData.get("newPassword") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!current || !newPass || !confirm) return { error: "All fields are required" };
  if (newPass.length < 8) return { error: "New password must be at least 8 characters" };
  if (newPass !== confirm) return { error: "Passwords do not match" };
  if (current === newPass) return { error: "New password must be different from current" };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.passwordHash) return { error: "Cannot change password for OAuth accounts" };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(newPass, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash },
  });

  return { success: true };
}

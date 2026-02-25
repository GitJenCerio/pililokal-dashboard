"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/email";

const BCRYPT_ROUNDS = 12;

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export async function listUsersAction(): Promise<UserListItem[]> {
  const session = await getServerSession();
  requireRole(session, "ADMIN");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return users;
}

export async function createUserAction(data: {
  name: string;
  email: string;
  role: string;
}): Promise<{ error?: string; tempPassword?: string; emailError?: string }> {
  const session = await getServerSession();
  requireRole(session, "ADMIN");

  const email = data.email?.trim().toLowerCase();
  const name = data.name?.trim();
  if (!email || !name) return { error: "Name and email are required" };
  const role = ["ADMIN", "EDITOR", "VIEWER"].includes(data.role) ? data.role : "VIEWER";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with this email already exists" };

  const tempPassword = crypto.randomBytes(8).toString("base64").replace(/[+/=]/g, "").slice(0, 16);
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash,
      invitedById: session.userId,
    },
  });

  const emailResult = await sendInviteEmail({
    to: email,
    name,
    tempPassword,
    role,
  });
  if (!emailResult.ok) {
    revalidatePath("/dashboard/admin/users");
    return { tempPassword, emailError: emailResult.error };
  }

  revalidatePath("/dashboard/admin/users");
  return { tempPassword };
}

export async function updateUserRoleAction(
  userId: string,
  role: string
): Promise<{ error?: string }> {
  const session = await getServerSession();
  requireRole(session, "ADMIN");

  const validRole = ["ADMIN", "EDITOR", "VIEWER"].includes(role) ? role : "VIEWER";
  await prisma.user.update({
    where: { id: userId },
    data: { role: validRole },
  });
  revalidatePath("/dashboard/admin/users");
  return {};
}

export async function toggleUserActiveAction(userId: string): Promise<{ error?: string }> {
  const session = await getServerSession();
  requireRole(session, "ADMIN");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.id === session.userId) return { error: "You cannot deactivate your own account" };

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
  revalidatePath("/dashboard/admin/users");
  return {};
}

export async function resetUserPasswordAction(
  userId: string
): Promise<{ error?: string; tempPassword?: string }> {
  const session = await getServerSession();
  requireRole(session, "ADMIN");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const tempPassword = crypto.randomBytes(8).toString("base64").replace(/[+/=]/g, "").slice(0, 16);
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  revalidatePath("/dashboard/admin/users");
  return { tempPassword };
}

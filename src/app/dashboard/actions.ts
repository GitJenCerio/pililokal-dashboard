"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ShopifyStatus } from "@/lib/types";

export async function updateStatusAction(merchantId: string, status: ShopifyStatus) {
  const session = await getServerSession();
  if (!session) return;

  await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      shopifyStatus: status,
      lastUpdatedById: session.userId,
    },
  });

  await prisma.activityLog.create({
    data: {
      merchantId,
      userId: session.userId,
      type: "STATUS_CHANGE",
      message: `Status changed to ${status.replace(/_/g, " ")}`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/merchants/${merchantId}`);
}

export async function addNoteAction(merchantId: string, message: string) {
  const session = await getServerSession();
  if (!session) return;

  await prisma.activityLog.create({
    data: {
      merchantId,
      userId: session.userId,
      type: "NOTE",
      message,
    },
  });

  await prisma.merchant.update({
    where: { id: merchantId },
    data: { lastUpdatedById: session.userId },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/merchants/${merchantId}`);
}

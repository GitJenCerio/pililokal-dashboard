"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { SubmissionType, SelectionMode, ShopifyStatus } from "@/lib/types";

export async function saveMerchantAction(
  merchantId: string | null,
  data: Record<string, string | undefined>
) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };
  requireRole(session, "EDITOR");

  const name = data.name?.trim();
  if (!name) return { error: "Merchant name is required" };

  const bool = (v: string | undefined) =>
    v === "true" || v === "on" || v === "yes";

  const payload = {
    name,
    category: data.category?.trim() ?? "",
    contactName: data.contactName?.trim() ?? null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    sourceWebsite: data.sourceWebsite?.trim() || null,
    sourceFacebook: data.sourceFacebook?.trim() || null,
    sourceInstagram: data.sourceInstagram?.trim() || null,
    submissionType: (data.submissionType as SubmissionType) ?? "MERCHANT_SELECTED",
    selectionMode: (data.selectionMode as SelectionMode) ?? "SELECTED_ONLY",
    selectionConfirmed: bool(data.selectionConfirmed),
    businessAddress: data.businessAddress?.trim() || null,
    warehouseAddress: data.warehouseAddress?.trim() || null,
    returnAddress: data.returnAddress?.trim() || null,
    addressCountry: data.region?.trim() || data.addressCountry?.trim() || null,
    addressState: data.addressState?.trim() || null,
    addressZip: data.addressZip?.trim() || null,
    notes: data.notes?.trim() || null,
    lastUpdatedById: session.userId,
  };

  if (merchantId) {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: payload,
    });
    await prisma.activityLog.create({
      data: {
        merchantId,
        userId: session.userId,
        type: "DATA_UPDATE",
        message: "Merchant details updated",
      },
    });
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/merchants/${merchantId}`);
    return { redirect: `/dashboard/merchants/${merchantId}` };
  } else {
    const merchant = await prisma.merchant.create({
      data: payload,
    });
    await prisma.activityLog.create({
      data: {
        merchantId: merchant.id,
        userId: session.userId,
        type: "DATA_UPDATE",
        message: "Merchant created",
      },
    });
    revalidatePath("/dashboard");
    return { redirect: `/dashboard/merchants/${merchant.id}` };
  }
}

export async function bulkUpdateStatusAction(
  ids: string[],
  status: ShopifyStatus
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };
  requireRole(session, "EDITOR");

  if (ids.length === 0) return { error: "No merchants selected" };

  // Single query to update all merchants at once
  await prisma.merchant.updateMany({
    where: { id: { in: ids } },
    data: {
      shopifyStatus: status,
      lastUpdatedById: session.userId,
      lastUpdatedAt: new Date(),
    },
  });

  // Batch insert activity logs with createMany
  await prisma.activityLog.createMany({
    data: ids.map((id) => ({
      merchantId: id,
      userId: session.userId,
      type: "STATUS_CHANGE",
      message: `Bulk status updated to ${status}`,
    })),
  });

  revalidatePath("/dashboard");
  return {};
}

export async function bulkDeleteAction(ids: string[]): Promise<{ error?: string }> {
  const session = await getServerSession();
  requireRole(session, "ADMIN");

  if (ids.length === 0) return { error: "No merchants selected" };

  await prisma.merchant.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/dashboard");
  return {};
}

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
  revalidatePath("/dashboard/shopify");
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

export async function bulkAddConfirmedAsMerchantsAction(): Promise<{
  success: boolean;
  added: number;
  skipped: number;
  error?: string;
}> {
  const session = await getServerSession();
  if (!session) return { success: false, added: 0, skipped: 0, error: "Unauthorized" };

  try {
    const confirmedLeads = await prisma.lead.findMany({
      where: {
        sourceSheet: { in: ["PH Confirmed Merchants", "US Confirmed Merchants"] },
      },
    });
    const existingNames = new Set(
      (await prisma.merchant.findMany({ select: { name: true } })).map((m) => m.name.toLowerCase())
    );

    let added = 0;
    let skipped = 0;

    for (const lead of confirmedLeads) {
      const name = lead.merchantName?.trim();
      if (!name) continue;
      if (existingNames.has(name.toLowerCase())) {
        skipped++;
        continue;
      }

      await prisma.merchant.create({
        data: {
          name,
          category: lead.category ?? "",
          contactName: lead.contact ?? null,
          email: lead.email ?? null,
          phone: lead.contact ?? null,
          lastUpdatedById: session.userId,
        },
      });
      existingNames.add(name.toLowerCase());
      added++;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shopify");
    return { success: true, added, skipped };
  } catch (err) {
    return {
      success: false,
      added: 0,
      skipped: 0,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

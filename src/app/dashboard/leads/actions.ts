"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { parseExcelWithBreakdown } from "@/lib/leads-data";
import { importLeadsToDb, updateLeadInDb, type LeadCreateInput } from "@/lib/leads-db";

export async function importLeadsFromExcelAction(): Promise<
  { success: true; count: number; bySheet: Record<string, number> } | { success: false; error: string }
> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const { rows, bySheet } = parseExcelWithBreakdown();
    if (rows.length === 0) {
      return { success: false, error: "No data found. Place Pililokal_Merchants_Cleaned.xlsx in project root." };
    }

    const input: LeadCreateInput[] = rows.map((r) => ({
      sourceSheet: r.sourceSheet,
      merchantName: r.merchantName,
      category: r.category,
      products: r.products || null,
      email: r.email || null,
      contact: r.contact || null,
      address: r.address || null,
      statusNotes: r.statusNotes || null,
      fb: r.fb || null,
      ig: r.ig || null,
      tiktok: r.tiktok || null,
      website: r.website || null,
      encodedBy: r.encodedBy || null,
      result: r.result || null,
      callsUpdate: r.callsUpdate || null,
      followupEmail: r.followupEmail || null,
      reachViaSocmed: r.reachViaSocmed || null,
      registeredName: r.registeredName || null,
      contactPerson: r.contactPerson || null,
      designation: r.designation || null,
      authorizedSignatory: r.authorizedSignatory || null,
      country: r.country || null,
      city: r.city || null,
      socialScore: r.socialScore ?? null,
      stage: r.stage || null,
      needsFollowup: r.needsFollowup ?? false,
      lastActivityDates: r.lastActivityDates ? JSON.stringify(r.lastActivityDates) : null,
    }));

    const count = await importLeadsToDb(input);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    return { success: true, count, bySheet };
  } catch (err) {
    console.error("Import failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Import failed",
    };
  }
}

export async function updateLeadAction(
  leadId: string,
  data: {
    merchantName?: string;
    category?: string;
    email?: string;
    contact?: string;
    address?: string;
    statusNotes?: string;
    result?: string;
    callsUpdate?: string;
    country?: string;
    sourceSheet?: string;
    [key: string]: string | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await updateLeadInDb(leadId, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (err) {
    console.error("Update lead failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function updateLeadShopifyStatusAction(
  leadId: string,
  shopifyStatus: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { shopifyStatus: shopifyStatus || "NOT_STARTED" },
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/shopify");
    return { success: true };
  } catch (err) {
    console.error("Update lead shopify status failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function deleteLeadAction(leadId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await prisma.lead.delete({
      where: { id: leadId },
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/shopify");
    return { success: true };
  } catch (err) {
    console.error("Delete lead failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function convertLeadToMerchantAction(leadId: string): Promise<
  | { success: true; redirect: string }
  | { success: false; error: string }
> {
  const session = await getServerSession();
  requireRole(session, "EDITOR");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Lead not found" };

  const merchant = await prisma.merchant.create({
    data: {
      name: lead.merchantName,
      category: lead.category || "",
      contactName: lead.contact ?? null,
      email: lead.email ?? null,
      phone: lead.contact ?? null,
      sourceFacebook: lead.fb ?? null,
      sourceInstagram: lead.ig ?? null,
      sourceWebsite: lead.website ?? null,
      notes: lead.statusNotes ? `Converted from lead. ${lead.statusNotes}` : "Converted from lead.",
      lastUpdatedById: session.userId,
    },
  });

  await prisma.activityLog.create({
    data: {
      merchantId: merchant.id,
      userId: session.userId,
      type: "DATA_UPDATE",
      message: `Converted from Lead ${leadId}`,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { stage: "Converted" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return { success: true, redirect: `/dashboard/merchants/${merchant.id}` };
}

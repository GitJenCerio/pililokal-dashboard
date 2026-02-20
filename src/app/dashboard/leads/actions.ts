"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
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

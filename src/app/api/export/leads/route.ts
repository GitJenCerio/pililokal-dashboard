import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  requireRole(session, "EDITOR");

  const leads = await prisma.lead.findMany({
    orderBy: { importedAt: "desc" },
    select: {
      merchantName: true,
      category: true,
      stage: true,
      email: true,
      contact: true,
      address: true,
      country: true,
      city: true,
      fb: true,
      ig: true,
      tiktok: true,
      website: true,
      socialScore: true,
      statusNotes: true,
      result: true,
      callsUpdate: true,
      needsFollowup: true,
      shopifyStatus: true,
      sourceSheet: true,
      encodedBy: true,
      importedAt: true,
    },
  });

  const rows = leads.map((l) => ({
    "Merchant Name": l.merchantName,
    Category: l.category ?? "",
    Stage: l.stage ?? "",
    Email: l.email ?? "",
    Contact: l.contact ?? "",
    Address: l.address ?? "",
    Country: l.country ?? "",
    City: l.city ?? "",
    Facebook: l.fb ?? "",
    Instagram: l.ig ?? "",
    TikTok: l.tiktok ?? "",
    Website: l.website ?? "",
    "Social Score": l.socialScore ?? 0,
    "Status Notes": l.statusNotes ?? "",
    Result: l.result ?? "",
    "Calls Update": l.callsUpdate ?? "",
    "Needs Followup": l.needsFollowup ? "Yes" : "No",
    "Shopify Status": l.shopifyStatus,
    "Source Sheet": l.sourceSheet,
    "Encoded By": l.encodedBy ?? "",
    "Imported At": l.importedAt.toISOString().slice(0, 10),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

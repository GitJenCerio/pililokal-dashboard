import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAddressComplete, computeCompletionPercent } from "@/lib/merchant-utils";
import { exportMerchantsToExcel } from "@/lib/export";

const statusLabelMap: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  UPLOADED: "Uploaded",
  LIVE: "Live",
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ids: string[];
  try {
    const body = await request.json();
    ids = Array.isArray(body?.ids) ? body.ids : [];
  } catch {
    return NextResponse.json({ error: "Invalid body: ids array required" }, { status: 400 });
  }

  if (ids.length === 0) {
    return NextResponse.json({ error: "No merchants selected" }, { status: 400 });
  }

  const merchants = await prisma.merchant.findMany({
    where: { id: { in: ids } },
    include: {
      lastUpdatedBy: { select: { name: true } },
      approvedProducts: { select: { id: true } },
    },
  });

  const rows = merchants.map((m) => {
    const addressComplete = isAddressComplete(m);
    const completionPercent = computeCompletionPercent({
      ...m,
      approvedProducts: m.approvedProducts,
    });
    return {
      name: m.name,
      category: m.category ?? "",
      status: statusLabelMap[m.shopifyStatus] ?? m.shopifyStatus,
      contact: m.contactName ?? "",
      email: m.email ?? "",
      phone: m.phone ?? "",
      completionPercent,
      lastUpdated: m.lastUpdatedAt.toISOString().slice(0, 10),
    };
  });

  const buffer = exportMerchantsToExcel(rows);
  const filename = `merchants-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

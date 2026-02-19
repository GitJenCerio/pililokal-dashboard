import { prisma } from "@/lib/db";
import { loadLeadsFromDb } from "@/lib/leads-db";
import { isAddressComplete, computeCompletionPercent, needsAttention } from "@/lib/merchant-utils";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { ShopifyStatus, SubmissionType, SelectionMode } from "@/lib/types";

type MerchantRow = {
  id: string;
  name: string;
  category: string;
  submissionType: SubmissionType;
  selectionMode: SelectionMode;
  shopifyStatus: ShopifyStatus;
  productsSubmittedCount: number | null;
  productsUploadedCount: number;
  lastUpdatedAt: Date;
  lastUpdatedBy: { name: string } | null;
  approvedProducts: { id: string }[];
  businessAddress: string | null;
  returnAddress: string | null;
  addressCountry: string | null;
  addressState: string | null;
  addressZip: string | null;
  productsTargetCount: number | null;
  variantsComplete: boolean;
  pricingAdded: boolean;
  inventoryAdded: boolean;
  skuAdded: boolean;
  imagesComplete: boolean;
  finalReviewed: boolean;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    submission?: string;
    selection?: string;
    attention?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const merchants = await prisma.merchant.findMany({
    include: {
      lastUpdatedBy: { select: { name: true } },
      approvedProducts: { select: { id: true } },
    },
    orderBy: { lastUpdatedAt: "desc" },
  });

  const kpis = {
    total: merchants.length,
    notStarted: merchants.filter((m) => m.shopifyStatus === "NOT_STARTED").length,
    inProgress: merchants.filter((m) => m.shopifyStatus === "IN_PROGRESS").length,
    uploaded: merchants.filter((m) => m.shopifyStatus === "UPLOADED").length,
    live: merchants.filter((m) => m.shopifyStatus === "LIVE").length,
  };

  const rows: (MerchantRow & { addressComplete: boolean; completionPercent: number; attention: boolean })[] =
    merchants.map((m) => {
      const addressComplete = isAddressComplete(m);
      const completionPercent = computeCompletionPercent({
        ...m,
        approvedProducts: m.approvedProducts,
      });
      const attention = needsAttention(m, addressComplete);
      return {
        ...m,
        addressComplete,
        completionPercent,
        attention,
      };
    });

  const needsAttentionList = rows.filter((r) => r.attention).slice(0, 10);

  const leadsData = await loadLeadsFromDb();

  return (
    <DashboardClient
      merchants={rows}
      kpis={kpis}
      needsAttentionList={needsAttentionList}
      leadsData={leadsData}
      filters={{
        status: params.status,
        submission: params.submission,
        selection: params.selection,
        attention: params.attention,
        search: params.q,
      }}
    />
  );
}

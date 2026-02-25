import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { loadLeadsFromDb } from "@/lib/leads-db";
import { isAddressComplete, computeCompletionPercent, needsAttention } from "@/lib/merchant-utils";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { ShopifyStatus, SubmissionType, SelectionMode } from "@/lib/types";
import type { LeadRow } from "@/lib/leads-data";

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
  const session = await getServerSession();
  if (!session) redirect("/");
  const params = await searchParams;

  const [leadsData, needsAttentionMerchants] = await Promise.all([
    loadLeadsFromDb(),
    prisma.merchant.findMany({
      take: 50,
      orderBy: { lastUpdatedAt: "desc" },
      select: {
        id: true,
        name: true,
        shopifyStatus: true,
        lastUpdatedAt: true,
        businessAddress: true,
        returnAddress: true,
        addressCountry: true,
        addressState: true,
        addressZip: true,
        productsTargetCount: true,
        variantsComplete: true,
        pricingAdded: true,
        inventoryAdded: true,
        skuAdded: true,
        imagesComplete: true,
        finalReviewed: true,
        approvedProducts: { select: { id: true } },
      },
    }),
  ]);

  const phConfirmed = leadsData.bySheet["PH Confirmed Merchants"] ?? [];
  const usConfirmed = leadsData.bySheet["US Confirmed Merchants"] ?? [];
  const confirmedLeads: (LeadRow & { id: string })[] = [...phConfirmed, ...usConfirmed].filter(
    (r): r is LeadRow & { id: string } => typeof r.id === "string"
  );

  const shopifyKpis = {
    total: confirmedLeads.length,
    notStarted: confirmedLeads.filter((r) => (r.shopifyStatus || "NOT_STARTED") === "NOT_STARTED").length,
    inProgress: confirmedLeads.filter((r) => (r.shopifyStatus || "NOT_STARTED") === "IN_PROGRESS").length,
    uploaded: confirmedLeads.filter((r) => (r.shopifyStatus || "NOT_STARTED") === "UPLOADED").length,
    live: confirmedLeads.filter((r) => (r.shopifyStatus || "NOT_STARTED") === "LIVE").length,
  };

  const needsAttentionListRaw = needsAttentionMerchants
    .map((m) => {
      const addressComplete = isAddressComplete(m);
      const completionPercent = computeCompletionPercent({
        ...m,
        approvedProducts: m.approvedProducts,
      });
      const attention = needsAttention(m, addressComplete);
      return { ...m, addressComplete, completionPercent, attention };
    })
    .filter((r) => r.attention)
    .slice(0, 10);

  const needsAttentionList: (MerchantRow & { addressComplete: boolean; completionPercent: number; attention: boolean })[] =
    needsAttentionListRaw.map((m) => ({
      id: m.id,
      name: m.name,
      category: "",
      submissionType: "MERCHANT_SELECTED" as const,
      selectionMode: "SELECTED_ONLY" as const,
      shopifyStatus: m.shopifyStatus as ShopifyStatus,
      productsSubmittedCount: null,
      productsUploadedCount: 0,
      lastUpdatedAt: m.lastUpdatedAt,
      lastUpdatedBy: null,
      approvedProducts: [],
      businessAddress: null,
      returnAddress: null,
      addressCountry: null,
      addressState: null,
      addressZip: null,
      productsTargetCount: null,
      variantsComplete: false,
      pricingAdded: false,
      inventoryAdded: false,
      skuAdded: false,
      imagesComplete: false,
      finalReviewed: false,
      addressComplete: m.addressComplete,
      completionPercent: m.completionPercent,
      attention: true,
    }));

  return (
    <DashboardClient
      confirmedLeads={confirmedLeads}
      shopifyKpis={shopifyKpis}
      needsAttentionList={needsAttentionList}
      leadsData={leadsData}
      filters={{
        status: params.status,
        submission: params.submission,
        selection: params.selection,
        attention: params.attention,
        search: params.q,
      }}
      userRole={session.role}
    />
  );
}

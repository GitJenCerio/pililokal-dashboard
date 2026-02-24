import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
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

const PAGE_SIZE = 25;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    pageSize?: string;
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
  const cursor = params.cursor ?? null;
  const pageSize = Math.min(100, Math.max(10, parseInt(params.pageSize ?? String(PAGE_SIZE), 10) || PAGE_SIZE));

  const total = await prisma.merchant.count();

  const [kpisGroups, merchants, needsAttentionMerchants] = await Promise.all([
    prisma.merchant.groupBy({
      by: ["shopifyStatus"],
      _count: true,
    }),
    prisma.merchant.findMany({
      take: pageSize + 1,
      skip: cursor ? 1 : 0,
      ...(cursor ? { cursor: { id: cursor } } : {}),
      orderBy: { lastUpdatedAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        submissionType: true,
        selectionMode: true,
        shopifyStatus: true,
        productsSubmittedCount: true,
        productsUploadedCount: true,
        lastUpdatedAt: true,
        lastUpdatedById: true,
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
        lastUpdatedBy: { select: { name: true } },
        approvedProducts: { select: { id: true } },
      },
    }),
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

  const kpisMap = Object.fromEntries(kpisGroups.map((g) => [g.shopifyStatus, g._count]));
  const kpis = {
    total,
    notStarted: kpisMap.NOT_STARTED ?? 0,
    inProgress: kpisMap.IN_PROGRESS ?? 0,
    uploaded: kpisMap.UPLOADED ?? 0,
    live: kpisMap.LIVE ?? 0,
  };

  const hasNext = merchants.length > pageSize;
  const page = hasNext ? merchants.slice(0, pageSize) : merchants;
  const nextCursor = hasNext ? page[page.length - 1]?.id : null;

  const rows: (MerchantRow & { addressComplete: boolean; completionPercent: number; attention: boolean })[] =
    page.map((m) => {
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
      shopifyStatus: m.shopifyStatus,
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

  const leadsData = await loadLeadsFromDb();

  return (
    <DashboardClient
      merchants={rows}
      kpis={kpis}
      pagination={{ total, nextCursor, pageSize }}
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
      pagination={{ total, nextCursor, pageSize }}
      cursor={cursor}
    />
  );
}

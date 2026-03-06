import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MerchantsTable, type ConfirmedMerchantRow } from "@/components/merchant/merchants-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ShopifyStatus } from "@/lib/types";

const STATUS_OPTIONS: ShopifyStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "UPLOADED",
  "LIVE",
];

const PAGE_SIZE = 25;

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const q = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status && STATUS_OPTIONS.includes(params.status as ShopifyStatus)
    ? (params.status as ShopifyStatus)
    : undefined;
  const categoryFilter = (params.category ?? "").trim().toLowerCase() || undefined;

  const [merchants, confirmedLeads] = await Promise.all([
    prisma.merchant.findMany({
      orderBy: { lastUpdatedAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        contactName: true,
        email: true,
        shopifyStatus: true,
        lastUpdatedAt: true,
        lastUpdatedBy: { select: { name: true } },
      },
    }),
    prisma.lead.findMany({
      where: {
        sourceSheet: { in: ["PH Confirmed Merchants", "US Confirmed Merchants"] },
        NOT: { stage: "Converted" },
      },
      orderBy: { importedAt: "desc" },
      select: {
        id: true,
        merchantName: true,
        category: true,
        contact: true,
        email: true,
        shopifyStatus: true,
        importedAt: true,
        sourceSheet: true,
      },
    }),
  ]);

  const merchantRows: ConfirmedMerchantRow[] = merchants.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category ?? "",
    contactName: m.contactName,
    email: m.email,
    shopifyStatus: m.shopifyStatus,
    lastUpdatedAt: m.lastUpdatedAt,
    lastUpdatedBy: m.lastUpdatedBy?.name ?? null,
    type: "merchant",
  }));

  const leadRows: ConfirmedMerchantRow[] = confirmedLeads.map((l) => ({
      id: l.id,
      name: l.merchantName,
      category: l.category ?? "",
      contactName: l.contact,
      email: l.email,
      shopifyStatus: l.shopifyStatus ?? "NOT_STARTED",
      lastUpdatedAt: l.importedAt,
      lastUpdatedBy: null,
      type: "lead" as const,
      sourceSheet: l.sourceSheet,
    }));

  const combined = [...merchantRows, ...leadRows].sort(
    (a, b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime()
  );

  let filtered = combined;
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q) ||
        (r.contactName || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
    );
  }
  if (statusFilter) {
    filtered = filtered.filter((r) => r.shopifyStatus === statusFilter);
  }
  if (categoryFilter) {
    filtered = filtered.filter((r) => (r.category || "").toLowerCase().includes(categoryFilter));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Confirmed Merchants</h1>
        <Button asChild>
          <Link href="/dashboard/merchants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Merchant
          </Link>
        </Button>
      </div>

      <MerchantsTable
        rows={paged}
        currentPage={page}
        totalPages={totalPages}
        totalCount={total}
        searchParams={{ q: params.q ?? "", status: params.status ?? "", category: params.category ?? "" }}
      />
    </div>
  );
}

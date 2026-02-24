import { ShopifyUpdatesClient } from "@/components/dashboard/shopify-updates-client";
import { loadLeadsFromDb } from "@/lib/leads-db";

export const dynamic = "force-dynamic";

export default async function ShopifyUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sheet?: string }>;
}) {
  const params = await searchParams;
  const leadsData = await loadLeadsFromDb();

  return (
    <ShopifyUpdatesClient
      leadsData={leadsData}
      filters={{
        status: params.status,
        search: params.q,
        sheet: params.sheet,
      }}
    />
  );
}

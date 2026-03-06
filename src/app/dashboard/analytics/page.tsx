import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadLeadsFromDb } from "@/lib/leads-db";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session) redirect("/");

  const [leadsData, leads, merchants] = await Promise.all([
    loadLeadsFromDb(),
    prisma.lead.findMany({
      select: {
        id: true,
        stage: true,
        sourceSheet: true,
        category: true,
        country: true,
        encodedBy: true,
        lastActivityDates: true,
      },
    }),
    prisma.merchant.findMany({
      select: { id: true, category: true, shopifyStatus: true },
    }),
  ]);

  const pipelineByStage = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      const s = l.stage || l.sourceSheet || "Unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const categoryCounts = [...leads, ...merchants].reduce<Record<string, { leads: number; merchants: number }>>(
    (acc, row) => {
      const cat = row.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = { leads: 0, merchants: 0 };
      if ("stage" in row) acc[cat].leads++;
      else acc[cat].merchants++;
      return acc;
    },
    {}
  );
  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([name, data]) => ({ name, leads: data.leads, merchants: data.merchants }))
    .sort((a, b) => b.leads + b.merchants - (a.leads + a.merchants))
    .slice(0, 12);

  const countryData = [
    { name: "Philippines", value: leads.filter((l) => l.country === "PH").length },
    { name: "United States", value: leads.filter((l) => l.country === "US").length },
  ].filter((d) => d.value > 0);

  const encodedByData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      const e = l.encodedBy?.trim() || "Unassigned";
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <AnalyticsClient
      pipelineByStage={pipelineByStage}
      categoryBreakdown={categoryBreakdown}
      countryData={countryData}
      encodedByData={encodedByData}
      leadsData={leadsData}
    />
  );
}

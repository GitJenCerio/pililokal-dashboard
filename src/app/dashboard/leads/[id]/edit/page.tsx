import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LeadForm } from "@/components/leads/lead-form";

export default async function LeadEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session) notFound();

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  const leadRow = {
    id: lead.id,
    sourceSheet: lead.sourceSheet,
    merchantName: lead.merchantName,
    category: lead.category,
    products: lead.products ?? "",
    email: lead.email ?? "",
    contact: lead.contact ?? "",
    address: lead.address ?? "",
    statusNotes: lead.statusNotes ?? "",
    fb: lead.fb ?? "",
    ig: lead.ig ?? "",
    tiktok: lead.tiktok ?? "",
    website: lead.website ?? "",
    encodedBy: lead.encodedBy ?? "",
    result: lead.result ?? undefined,
    callsUpdate: lead.callsUpdate ?? undefined,
    followupEmail: lead.followupEmail ?? undefined,
    reachViaSocmed: lead.reachViaSocmed ?? undefined,
    registeredName: lead.registeredName ?? undefined,
    contactPerson: lead.contactPerson ?? undefined,
    designation: lead.designation ?? undefined,
    authorizedSignatory: lead.authorizedSignatory ?? undefined,
    country: (lead.country as "PH" | "US") ?? undefined,
    city: lead.city ?? undefined,
    socialScore: lead.socialScore ?? undefined,
    stage: lead.stage ?? undefined,
    needsFollowup: lead.needsFollowup,
    lastActivityDates: lead.lastActivityDates
      ? (JSON.parse(lead.lastActivityDates) as string[])
      : undefined,
    shopifyStatus: lead.shopifyStatus ?? undefined,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Lead: {lead.merchantName}</h1>
      <LeadForm lead={leadRow} />
    </div>
  );
}

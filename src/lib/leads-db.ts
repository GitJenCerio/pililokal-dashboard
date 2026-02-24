/**
 * Load leads from database and optionally import from Excel.
 * LeadRow shape is shared with leads-data.ts for UI compatibility.
 */

import { prisma } from "./db";
import type { SourceSheet } from "./leads-data";
import type { LeadRow } from "./leads-data";

const SHEET_NAMES: SourceSheet[] = [
  "PH Confirmed Merchants",
  "Interested Merchants",
  "PH New Leads",
  "US New Leads",
  "US Interested Merchants",
  "US Confirmed Merchants",
  "Previous Clients",
];

function dbToLeadRow(row: {
  id: string;
  sourceSheet: string;
  merchantName: string;
  category: string;
  products: string | null;
  email: string | null;
  contact: string | null;
  address: string | null;
  statusNotes: string | null;
  fb: string | null;
  ig: string | null;
  tiktok: string | null;
  website: string | null;
  encodedBy: string | null;
  result: string | null;
  callsUpdate: string | null;
  followupEmail: string | null;
  reachViaSocmed: string | null;
  registeredName: string | null;
  contactPerson: string | null;
  designation: string | null;
  authorizedSignatory: string | null;
  country: string | null;
  city: string | null;
  socialScore: number | null;
  stage: string | null;
  needsFollowup: boolean;
  lastActivityDates: string | null;
}): LeadRow {
  return {
    id: row.id,
    sourceSheet: row.sourceSheet as SourceSheet,
    merchantName: row.merchantName,
    category: row.category,
    products: row.products ?? "",
    email: row.email ?? "",
    contact: row.contact ?? "",
    address: row.address ?? "",
    statusNotes: row.statusNotes ?? "",
    fb: row.fb ?? "",
    ig: row.ig ?? "",
    tiktok: row.tiktok ?? "",
    website: row.website ?? "",
    encodedBy: row.encodedBy ?? "",
    result: row.result ?? undefined,
    callsUpdate: row.callsUpdate ?? undefined,
    followupEmail: row.followupEmail ?? undefined,
    reachViaSocmed: row.reachViaSocmed ?? undefined,
    registeredName: row.registeredName ?? undefined,
    contactPerson: row.contactPerson ?? undefined,
    designation: row.designation ?? undefined,
    authorizedSignatory: row.authorizedSignatory ?? undefined,
    country: (row.country as "PH" | "US") ?? undefined,
    city: row.city ?? undefined,
    socialScore: row.socialScore ?? undefined,
    stage: row.stage ?? undefined,
    needsFollowup: row.needsFollowup,
    lastActivityDates: row.lastActivityDates
      ? (JSON.parse(row.lastActivityDates) as string[])
      : undefined,
    shopifyStatus: row.shopifyStatus ?? undefined,
  };
}

export type LeadsDataResult = {
  allRows: LeadRow[];
  bySheet: Record<SourceSheet, LeadRow[]>;
  kpis: {
    total: number;
    phConfirmed: number;
    usConfirmed: number;
    sampleReceived: number;
    shippedInTransit: number;
    interested: number;
    usLeads: number;
    phLeads: number;
    previousClients: number;
    awaitingResponse: number;
    noAnswerUnreachable: number;
  };
};

function getEmptyData(): LeadsDataResult {
  return {
    allRows: [],
    bySheet: {
      "PH Confirmed Merchants": [],
      "Interested Merchants": [],
      "PH New Leads": [],
      "US New Leads": [],
      "US Interested Merchants": [],
      "US Confirmed Merchants": [],
      "Previous Clients": [],
    },
    kpis: {
      total: 0,
      phConfirmed: 0,
      usConfirmed: 0,
      sampleReceived: 0,
      shippedInTransit: 0,
      interested: 0,
      usLeads: 0,
      phLeads: 0,
      previousClients: 0,
      awaitingResponse: 0,
      noAnswerUnreachable: 0,
    },
  };
}

export async function loadLeadsFromDb(): Promise<LeadsDataResult> {
  try {
    const rows = await prisma.lead.findMany();
  if (rows.length === 0) return getEmptyData();

  const allRows = rows.map(dbToLeadRow);

  const bySheet: Record<SourceSheet, LeadRow[]> = {
    "PH Confirmed Merchants": [],
    "Interested Merchants": [],
    "PH New Leads": [],
    "US New Leads": [],
    "US Interested Merchants": [],
    "US Confirmed Merchants": [],
    "Previous Clients": [],
  };

  for (const r of allRows) {
    if (bySheet[r.sourceSheet]) {
      bySheet[r.sourceSheet].push(r);
    }
  }

  const phConfirmed = bySheet["PH Confirmed Merchants"];
  const interested = bySheet["Interested Merchants"];
  const phLeads = bySheet["PH New Leads"];
  const usLeads = bySheet["US New Leads"];
  const usConfirmedRows = bySheet["US Confirmed Merchants"];
  const prevClients = bySheet["Previous Clients"];

  const usConfirmed =
    usConfirmedRows.length > 0
      ? usConfirmedRows.length
      : usLeads.filter(
          (r) => (r.result || "").toLowerCase().trim() === "confirmed"
        ).length;

  const statusLower = (r: LeadRow) =>
    ((r.statusNotes || "") + (r.callsUpdate || "")).toLowerCase();

  const sampleReceived = phConfirmed.filter(
    (r) => statusLower(r).includes("sample") && statusLower(r).includes("received")
  ).length;

  const shippedInTransit = phConfirmed.filter(
    (r) => statusLower(r).includes("shipped") || statusLower(r).includes("lbc")
  ).length;

  const awaitingResponse = allRows.filter((r) =>
    statusLower(r).includes("awaiting response")
  ).length;

  const noAnswerUnreachable = allRows.filter(
    (r) =>
      statusLower(r).includes("no answer") ||
      statusLower(r).includes("cannot be reached") ||
      statusLower(r).includes("not answering")
  ).length;

  return {
    allRows,
    bySheet,
    kpis: {
      total: allRows.length,
      phConfirmed: phConfirmed.length,
      usConfirmed,
      sampleReceived,
      shippedInTransit,
      interested: interested.length,
      usLeads: usLeads.length,
      phLeads: phLeads.length,
      previousClients: prevClients.length,
      awaitingResponse,
      noAnswerUnreachable,
    },
  };
  } catch (err) {
    console.warn("loadLeadsFromDb failed (run 'npx prisma generate' if Lead model was added):", err);
    return getEmptyData();
  }
}

export type LeadCreateInput = {
  sourceSheet: string;
  merchantName: string;
  category: string;
  products?: string | null;
  email?: string | null;
  contact?: string | null;
  address?: string | null;
  statusNotes?: string | null;
  fb?: string | null;
  ig?: string | null;
  tiktok?: string | null;
  website?: string | null;
  encodedBy?: string | null;
  result?: string | null;
  callsUpdate?: string | null;
  followupEmail?: string | null;
  reachViaSocmed?: string | null;
  registeredName?: string | null;
  contactPerson?: string | null;
  designation?: string | null;
  authorizedSignatory?: string | null;
  country?: string | null;
  city?: string | null;
  socialScore?: number | null;
  stage?: string | null;
  needsFollowup?: boolean;
  lastActivityDates?: string | null;
};

export async function importLeadsToDb(leads: LeadCreateInput[]): Promise<number> {
  await prisma.lead.deleteMany({});
  if (leads.length === 0) return 0;

  await prisma.lead.createMany({
    data: leads.map((l) => ({
      sourceSheet: l.sourceSheet,
      merchantName: l.merchantName,
      category: l.category,
      products: l.products ?? null,
      email: l.email ?? null,
      contact: l.contact ?? null,
      address: l.address ?? null,
      statusNotes: l.statusNotes ?? null,
      fb: l.fb ?? null,
      ig: l.ig ?? null,
      tiktok: l.tiktok ?? null,
      website: l.website ?? null,
      encodedBy: l.encodedBy ?? null,
      result: l.result ?? null,
      callsUpdate: l.callsUpdate ?? null,
      followupEmail: l.followupEmail ?? null,
      reachViaSocmed: l.reachViaSocmed ?? null,
      registeredName: l.registeredName ?? null,
      contactPerson: l.contactPerson ?? null,
      designation: l.designation ?? null,
      authorizedSignatory: l.authorizedSignatory ?? null,
      country: l.country ?? null,
      city: l.city ?? null,
      socialScore: l.socialScore ?? null,
      stage: l.stage ?? null,
      needsFollowup: l.needsFollowup ?? false,
      lastActivityDates: l.lastActivityDates ?? null,
    })),
  });

  return leads.length;
}

export async function updateLeadInDb(
  leadId: string,
  data: Partial<{
    merchantName: string;
    category: string;
    products: string;
    email: string;
    contact: string;
    address: string;
    statusNotes: string;
    result: string;
    callsUpdate: string;
    followupEmail: string;
    country: string;
    city: string;
    fb: string;
    ig: string;
    tiktok: string;
    website: string;
    sourceSheet: string;
  }>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (data.merchantName !== undefined) update.merchantName = data.merchantName;
  if (data.sourceSheet !== undefined) update.sourceSheet = data.sourceSheet;
  if (data.category !== undefined) update.category = data.category;
  if (data.products !== undefined) update.products = data.products;
  if (data.email !== undefined) update.email = data.email || null;
  if (data.contact !== undefined) update.contact = data.contact || null;
  if (data.address !== undefined) update.address = data.address || null;
  if (data.statusNotes !== undefined) update.statusNotes = data.statusNotes || null;
  if (data.result !== undefined) update.result = data.result || null;
  if (data.callsUpdate !== undefined) update.callsUpdate = data.callsUpdate || null;
  if (data.followupEmail !== undefined) update.followupEmail = data.followupEmail || null;
  if (data.country !== undefined) update.country = data.country || null;
  if (data.city !== undefined) update.city = data.city || null;
  if (data.fb !== undefined) update.fb = data.fb || null;
  if (data.ig !== undefined) update.ig = data.ig || null;
  if (data.tiktok !== undefined) update.tiktok = data.tiktok || null;
  if (data.website !== undefined) update.website = data.website || null;
  if (Object.keys(update).length === 0) return;
  await prisma.lead.update({
    where: { id: leadId },
    data: update,
  });
}

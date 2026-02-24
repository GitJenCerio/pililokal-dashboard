/**
 * Load and process merchant leads from Pililokal_Merchants_Cleaned.xlsx
 * Place the Excel file in the project root or in /data
 */

import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export type SourceSheet =
  | "PH Confirmed Merchants"
  | "Interested Merchants"
  | "PH New Leads"
  | "US New Leads"
  | "US Interested Merchants"
  | "US Confirmed Merchants"
  | "Previous Clients";

export type LeadRow = {
  id?: string;
  sourceSheet: SourceSheet;
  merchantName: string;
  category: string;
  products: string;
  email: string;
  contact: string;
  address: string;
  statusNotes: string;
  fb: string;
  ig: string;
  tiktok: string;
  website: string;
  encodedBy: string;
  result?: string;
  callsUpdate?: string;
  followupEmail?: string;
  reachViaSocmed?: string;
  registeredName?: string;
  contactPerson?: string;
  designation?: string;
  authorizedSignatory?: string;
  // Derived
  country?: "PH" | "US";
  city?: string;
  socialScore?: number;
  stage?: string;
  needsFollowup?: boolean;
  lastActivityDates?: string[];
  shopifyStatus?: string;
};

const SHEET_NAMES: SourceSheet[] = [
  "PH Confirmed Merchants",
  "Interested Merchants",
  "PH New Leads",
  "US New Leads",
  "US Interested Merchants",
  "US Confirmed Merchants",
  "Previous Clients",
];

const COL_ALIASES: Record<string, string> = {
  "Merchant Name": "merchantName",
  "Merchant": "merchantName",
  Category: "category",
  Products: "products",
  Email: "email",
  Contact: "contact",
  Phone: "contact",
  Address: "address",
  "Status Notes": "statusNotes",
  "Status": "statusNotes",
  FB: "fb",
  Fb: "fb",
  IG: "ig",
  Ig: "ig",
  TikTok: "tiktok",
  Website: "website",
  "Encoded By": "encodedBy",
  Result: "result",
  Results: "result",
  Outcome: "result",
  "Call Result": "result",
  "Follow-up Result": "result",
  "Lead Result": "result",
  "Calls Update": "callsUpdate",
  "Followup Email": "followupEmail",
  "Reach Via Socmed": "reachViaSocmed",
  "Registered Name": "registeredName",
  "Contact Person": "contactPerson",
  Designation: "designation",
  "Authorized Signatory": "authorizedSignatory",
};

function normalizeHeader(h: string): string {
  const trimmed = String(h || "").trim().replace(/\u200b/g, "");
  const alias = COL_ALIASES[trimmed];
  if (alias) return alias;
  const lower = trimmed.toLowerCase();
  const found = Object.entries(COL_ALIASES).find(([k]) => k.toLowerCase() === lower);
  return found ? found[1] : trimmed;
}

function sheetToRows(sheet: XLSX.WorkSheet, sourceSheet: SourceSheet): LeadRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const keys = headers.map(normalizeHeader);

  return data.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      const v = row[h];
      const k = keys[i] || h;
      obj[k] = v != null ? String(v).trim() : "";
    });

    const statusNotes = (obj.statusNotes || obj.Status || "").trim();
    const address = (obj.address || obj.Address || "").trim();
    const result = (obj.result || "").trim();

    let country: "PH" | "US" | undefined;
    const addrLower = address.toLowerCase();
    if (
      addrLower.includes("united states") ||
      addrLower.includes(" usa") ||
      addrLower.endsWith(" usa") ||
      /,\s*(CA|NY|TX|FL|IL|WA|NJ|PA|OH|GA|AZ|CO|NV|OR|VA|MA|MI)\s*(?:\d|$)/i.test(address)
    ) {
      country = "US";
    } else if (addrLower.includes("philippines") || addrLower.includes("manila") || addrLower.includes("quezon") || addrLower.includes("cebu") || addrLower.includes("ph")) {
      country = "PH";
    } else if (sourceSheet === "US New Leads" || sourceSheet === "US Interested Merchants" || sourceSheet === "US Confirmed Merchants") {
      country = "US";
    } else if (sourceSheet === "PH New Leads" || sourceSheet === "PH Confirmed Merchants" || sourceSheet === "Interested Merchants") {
      country = "PH";
    } else if (address.length > 0) {
      country = "PH";
    }

    const city = address.split(",")[0]?.trim() || "";

    const fb = (obj.fb || obj.FB || "").trim();
    const ig = (obj.ig || obj.IG || "").trim();
    const tiktok = (obj.tiktok || "").trim();
    const website = (obj.website || "").trim();
    const hasFb = !!fb;
    const hasIg = !!ig;
    const hasTiktok = !!tiktok;
    const hasWebsite = !!website;
    const socialScore = [hasFb, hasIg, hasTiktok, hasWebsite].filter(Boolean).length;

    const stage = classifyStage(statusNotes, result, sourceSheet);

    const followUpKeywords = [
      "no answer",
      "cannot be reached",
      "no response",
      "awaiting",
      "will call again",
      "not answering",
      "busy",
      "called back",
    ];
    const combined = (statusNotes + " " + (obj.callsUpdate || "")).toLowerCase();
    const needsFollowup = followUpKeywords.some((k) => combined.includes(k));

    const lastActivityDates = extractDates(statusNotes + " " + (obj.callsUpdate || ""));

    return {
      sourceSheet,
      merchantName: (obj.merchantName || obj.Merchant || "").trim(),
      category: (obj.category || "").trim().replace(/\u200b/g, ""),
      products: (obj.products || "").trim(),
      email: (obj.email || "").trim(),
      contact: (obj.contact || obj.Phone || "").trim(),
      address,
      statusNotes,
      fb,
      ig,
      tiktok,
      website,
      encodedBy: (obj.encodedBy || "").trim(),
      result: result || undefined,
      callsUpdate: (obj.callsUpdate || "").trim() || undefined,
      followupEmail: (obj.followupEmail || "").trim() || undefined,
      reachViaSocmed: (obj.reachViaSocmed || "").trim() || undefined,
      registeredName: (obj.registeredName || "").trim() || undefined,
      contactPerson: (obj.contactPerson || "").trim() || undefined,
      designation: (obj.designation || "").trim() || undefined,
      authorizedSignatory: (obj.authorizedSignatory || "").trim() || undefined,
      country,
      city,
      socialScore,
      stage,
      needsFollowup,
      lastActivityDates,
    };
  });
}

function classifyStage(
  statusNotes: string,
  result: string,
  sourceSheet: SourceSheet
): string {
  const s = (statusNotes + " " + result).toLowerCase();

  if (sourceSheet === "PH Confirmed Merchants") {
    if (s.includes("sample") && s.includes("received")) return "Sample Received";
    if (s.includes("shipped") || s.includes("lbc")) return "Shipped / In Transit";
    return "Confirmed";
  }
  if (sourceSheet === "US Confirmed Merchants") return "Confirmed";
  if (sourceSheet === "Interested Merchants" || sourceSheet === "US Interested Merchants")
    return "Interested / Replied";
  if (sourceSheet === "Previous Clients") return "Previous Client";

  if (s.includes("sample") && s.includes("received")) return "Sample Received";
  if (s.includes("confirmed") || s.includes("will ship")) return "Confirmed";
  if (s.includes("interested") || s.includes("replied") || s.includes("zoom meeting"))
    return "Interested / Replied";
  if (s.includes("email sent") || s.includes("called")) return "Contacted";
  if (s.includes("no response") || s.includes("no answer")) return "No Response";
  if (s.includes("declined") || s.includes("closed")) return "Declined / Closed";

  return "New / Unknown";
}

function extractDates(text: string): string[] {
  const patterns = [
    /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/g,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/gi,
  ];
  const dates: string[] = [];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) dates.push(m[1] ?? m[0]);
  }
  return [...new Set(dates)];
}

function getEmptyData() {
  return {
    allRows: [] as LeadRow[],
    bySheet: {
      "PH Confirmed Merchants": [],
      "Interested Merchants": [],
      "PH New Leads": [],
      "US New Leads": [],
      "US Interested Merchants": [],
      "US Confirmed Merchants": [],
      "Previous Clients": [],
    } as Record<SourceSheet, LeadRow[]>,
    kpis: {
      total: 0,
      phConfirmed: 0,
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

function findExcelPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "Pililokal_Merchants_Cleaned.xlsx"),
    path.join(process.cwd(), "data", "Pililokal_Merchants_Cleaned.xlsx"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function loadLeadsData(): {
  allRows: LeadRow[];
  bySheet: Record<SourceSheet, LeadRow[]>;
  kpis: {
    total: number;
    phConfirmed: number;
    sampleReceived: number;
    shippedInTransit: number;
    interested: number;
    usLeads: number;
    phLeads: number;
    previousClients: number;
    awaitingResponse: number;
    noAnswerUnreachable: number;
  };
} {
  const excelPath = findExcelPath();
  if (!excelPath) {
    return getEmptyData();
  }

  let wb: XLSX.WorkBook;
  try {
    const buffer = fs.readFileSync(excelPath);
    wb = XLSX.read(buffer, { type: "buffer" });
  } catch (err) {
    console.warn("Could not read Excel file:", excelPath, err);
    return getEmptyData();
  }
  const bySheet: Partial<Record<SourceSheet, LeadRow[]>> = {};
  const sheetNameMap = new Map(
    wb.SheetNames.map((s) => [s.toLowerCase().trim(), s])
  );

  for (const name of SHEET_NAMES) {
    let sh = wb.Sheets[name];
    if (!sh) {
      const actual = sheetNameMap.get(name.toLowerCase().trim());
      if (actual) sh = wb.Sheets[actual];
    }
    if (sh) {
      bySheet[name] = sheetToRows(sh, name);
    } else {
      bySheet[name] = [];
    }
  }

  const allRows: LeadRow[] = [];
  for (const name of SHEET_NAMES) {
    allRows.push(...(bySheet[name as SourceSheet] ?? []));
  }

  const phConfirmed = bySheet["PH Confirmed Merchants"] ?? [];
  const interested = bySheet["Interested Merchants"] ?? [];
  const phLeads = bySheet["PH New Leads"] ?? [];
  const usLeads = bySheet["US New Leads"] ?? [];
  const prevClients = bySheet["Previous Clients"] ?? [];

  const statusLower = (r: LeadRow) =>
    ((r.statusNotes || "") + (r.callsUpdate || "")).toLowerCase();

  const sampleReceived = phConfirmed.filter(
    (r) => statusLower(r).includes("sample") && statusLower(r).includes("received")
  ).length;

  const shippedInTransit = phConfirmed.filter(
    (r) =>
      statusLower(r).includes("shipped") || statusLower(r).includes("lbc")
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
    bySheet: bySheet as Record<SourceSheet, LeadRow[]>,
    kpis: {
      total: allRows.length,
      phConfirmed: phConfirmed.length,
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
}

/** Parse Excel file and return rows ready for DB import */
export function parseExcelToLeadRows(): LeadRow[] {
  const result = loadLeadsData();
  return result.allRows;
}

/** Parse Excel and return rows plus per-sheet breakdown (for import feedback) */
export function parseExcelWithBreakdown(): {
  rows: LeadRow[];
  bySheet: Record<string, number>;
} {
  const result = loadLeadsData();
  const bySheet: Record<string, number> = {};
  for (const [name, arr] of Object.entries(result.bySheet)) {
    if (Array.isArray(arr) && arr.length > 0) {
      bySheet[name] = arr.length;
    }
  }
  return { rows: result.allRows, bySheet };
}

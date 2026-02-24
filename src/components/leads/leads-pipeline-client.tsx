"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { LeadRow, SourceSheet } from "@/lib/leads-data";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateLeadAction, convertLeadToMerchantAction } from "@/app/dashboard/leads/actions";
import {
  Search,
  Facebook,
  Instagram,
  Globe,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  User,
  Pencil,
  UserPlus,
  Loader2,
  Trash2,
} from "lucide-react";

const BAR_DARK = "#3d2817";
const BAR_LIGHT = "#e8b080";

function interpolateColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getBarColors(data: { count: number }[]): string[] {
  if (data.length === 0) return [];
  const counts = data.map((d) => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || 1;
  return data.map((d) => {
    const ratio = (d.count - min) / range;
    return interpolateColor(BAR_LIGHT, BAR_DARK, ratio);
  });
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

type LeadsData = import("@/lib/leads-db").LeadsDataResult;

const SHEET_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All sheets" },
  { value: "PH Confirmed Merchants", label: "PH Confirmed" },
  { value: "Interested Merchants", label: "Interested" },
  { value: "PH New Leads", label: "PH New Leads" },
  { value: "US New Leads", label: "US New Leads" },
  { value: "US Interested Merchants", label: "US Interested" },
  { value: "US Confirmed Merchants", label: "US Confirmed" },
  { value: "Previous Clients", label: "Previous Clients" },
];

const CATEGORY_OPTIONS = [
  "Clothing & Wearables",
  "Food & Gourmet Products",
  "Home Décor & Handicrafts",
  "Bags & Accessories",
  "Candles & Home Fragrances",
  "Stationery & Paper Products",
  "Art & Figurines",
  "Handwoven Textiles / Fabrics",
  "Heritage / Multi-Product",
  "Lifestyle",
  "Liquor / Beverages",
  "Miscellaneous / Specialty Products",
  "Other",
];

const RESULT_CHART_COLORS: Record<string, string> = {
  Confirmed: "#22c55e",
  Interested: "#eab308",
  "replied but not yet confirmed": "#eab308",
  "Interested / Replied": "#eab308",
  "No Response": "#ef4444",
  Declined: "#6b7280",
  "Closed or not Qualified": "#6b7280",
  "Declined / Closed": "#6b7280",
  "Sample Received": "#22c55e",
  Contacted: "#3b82f6",
  "New / Unknown": "#94a3b8",
  "(blank)": "#94a3b8",
};

function LeadEditForm({
  lead,
  onCancel,
  onSaved,
  saving,
  setSaving,
  error,
  setError,
}: {
  lead: LeadRow & { id: string };
  onCancel: () => void;
  onSaved: (updated: LeadRow) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateLeadAction(lead.id, {
      merchantName: (formData.get("merchantName") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      contact: (formData.get("contact") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      fb: (formData.get("fb") as string) || undefined,
      ig: (formData.get("ig") as string) || undefined,
      tiktok: (formData.get("tiktok") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      statusNotes: (formData.get("statusNotes") as string) || undefined,
      result: (formData.get("result") as string) || undefined,
      callsUpdate: (formData.get("callsUpdate") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
    });
    setSaving(false);
    if (result.success) {
      onSaved({
        ...lead,
        merchantName: (formData.get("merchantName") as string) || lead.merchantName,
        category: (formData.get("category") as string) || lead.category,
        email: (formData.get("email") as string) ?? lead.email,
        contact: (formData.get("contact") as string) ?? lead.contact,
        address: (formData.get("address") as string) ?? lead.address,
        fb: (formData.get("fb") as string) ?? lead.fb,
        ig: (formData.get("ig") as string) ?? lead.ig,
        tiktok: (formData.get("tiktok") as string) ?? lead.tiktok,
        website: (formData.get("website") as string) ?? lead.website,
        statusNotes: (formData.get("statusNotes") as string) ?? lead.statusNotes,
        result: (formData.get("result") as string) ?? lead.result,
        callsUpdate: (formData.get("callsUpdate") as string) ?? lead.callsUpdate,
        country: ((formData.get("country") as string) || undefined) as "PH" | "US" | undefined,
      });
    } else {
      setError(result.error ?? "Update failed");
    }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="merchantName">Merchant Name</Label>
          <Input id="merchantName" name="merchantName" defaultValue={lead.merchantName} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={lead.category ?? ""}
          >
            <option value="">—</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={lead.email} />
        </div>
        <div>
          <Label htmlFor="contact">Contact / Phone</Label>
          <Input id="contact" name="contact" defaultValue={lead.contact} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={lead.address} />
        </div>
        <div>
          <Label htmlFor="country">Region (PH / US)</Label>
          <select
            id="country"
            name="country"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={lead.country ?? ""}
          >
            <option value="">—</option>
            <option value="PH">Philippines (PH)</option>
            <option value="US">United States (US)</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fb">Facebook</Label>
          <Input id="fb" name="fb" type="url" defaultValue={lead.fb} placeholder="https://facebook.com/..." />
        </div>
        <div>
          <Label htmlFor="ig">Instagram</Label>
          <Input id="ig" name="ig" type="url" defaultValue={lead.ig} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <Label htmlFor="tiktok">TikTok</Label>
          <Input id="tiktok" name="tiktok" type="url" defaultValue={lead.tiktok} placeholder="https://tiktok.com/..." />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" defaultValue={lead.website} placeholder="https://..." />
        </div>
      </div>
      <div>
        <Label htmlFor="statusNotes">Status Notes</Label>
        <Textarea
          id="statusNotes"
          name="statusNotes"
          rows={3}
          className="mt-1"
          defaultValue={lead.statusNotes}
        />
      </div>
      <div>
        <Label htmlFor="sourceSheet">Pipeline Stage</Label>
        <select
          id="sourceSheet"
          name="sourceSheet"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={lead.sourceSheet}
        >
          {SHEET_OPTIONS.filter((o) => o.value !== "all").map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {(lead.sourceSheet === "US New Leads" ||
        lead.sourceSheet === "US Interested Merchants" ||
        lead.sourceSheet === "US Confirmed Merchants") && (
        <div>
          <Label htmlFor="result">Result</Label>
          <select
            id="result"
            name="result"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={lead.result ?? ""}
          >
            <option value="">—</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Interested">Interested</option>
            <option value="No Response">No Response</option>
            <option value="Declined">Declined</option>
            <option value="Closed or not Qualified">Closed or not Qualified</option>
          </select>
        </div>
      )}
      <div>
        <Label htmlFor="callsUpdate">Calls Update</Label>
        <Textarea
          id="callsUpdate"
          name="callsUpdate"
          rows={2}
          className="mt-1"
          defaultValue={lead.callsUpdate}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#5e3c28] text-white hover:bg-[#4a2f20]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-[#5e3c28] text-[#5e3c28] hover:bg-[#5e3c28]/10"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function LeadsPipelineClient({
  data,
  defaultCountry,
}: {
  data: LeadsData;
  defaultCountry?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sheetFilter, setSheetFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>(
    defaultCountry === "PH" || defaultCountry === "US" ? defaultCountry : "all"
  );
  const [hasEmailFilter, setHasEmailFilter] = useState<string>("all");
  const [hasSocialFilter, setHasSocialFilter] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<LeadRow | null>(null);
  const [editingLead, setEditingLead] = useState<LeadRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  const filtered = data.allRows.filter((r) => {
    if (sheetFilter !== "all" && r.sourceSheet !== sheetFilter) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (countryFilter !== "all" && r.country !== countryFilter) return false;
    if (hasEmailFilter === "yes" && !r.email) return false;
    if (hasEmailFilter === "no" && r.email) return false;
    if (hasSocialFilter === "yes" && (r.socialScore ?? 0) === 0) return false;
    if (hasSocialFilter === "no" && (r.socialScore ?? 0) > 0) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        r.merchantName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.statusNotes.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const dataForCharts = countryFilter !== "all" ? filtered : data.allRows;
  const categories = [...new Set(dataForCharts.map((r) => r.category).filter(Boolean))].sort();
  const stageCounts = dataForCharts.reduce<Record<string, number>>((acc, r) => {
    const s = r.stage ?? "New / Unknown";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const funnelData = Object.entries(stageCounts).map(([name, count]) => ({ name, count }));

  const categoryData = Object.entries(
    dataForCharts.reduce<Record<string, number>>((acc, r) => {
      if (!r.category.trim()) return acc;
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const geoData = dataForCharts.reduce<Record<string, number>>((acc, r) => {
    const city = r.city || "Unknown";
    acc[city] = (acc[city] ?? 0) + 1;
    return acc;
  }, {});
  const topCitiesLimit = countryFilter === "PH" ? 5 : 10;
  const topCities = Object.entries(geoData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topCitiesLimit)
    .map(([name, count]) => ({ name, count }));

  const funnelBarColors = getBarColors(funnelData);
  const categoryBarColors = getBarColors(categoryData);
  const topCitiesBarColors = getBarColors(topCities);

  const usLeadsForChart =
    countryFilter === "PH"
      ? []
      : dataForCharts.filter(
          (r) =>
            r.sourceSheet === "US New Leads" || r.sourceSheet === "US Interested Merchants"
        );
  const usResultCounts = usLeadsForChart.reduce<Record<string, number>>(
    (acc, r) => {
      const v = (r.result || "(blank)").trim();
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const usResultData = Object.entries(usResultCounts).map(([name, value]) => ({
    name: name || "(blank)",
    value,
  }));

  const resultChartTitle =
    countryFilter === "PH"
      ? "PH Leads Result"
      : countryFilter === "US"
        ? "US Leads Result"
        : "All Leads Result";
  const resultChartData =
    countryFilter === "US"
      ? usResultData
      : funnelData.map(({ name, count }) => ({ name, value: count }));

  const followUpList = dataForCharts
    .filter((r) => r.needsFollowup)
    .sort((a, b) => {
      const aLast = a.lastActivityDates?.[0] ?? "";
      const bLast = b.lastActivityDates?.[0] ?? "";
      return aLast.localeCompare(bLast);
    })
    .slice(0, 20);

  const socialPct = {
    fb: dataForCharts.filter((r) => r.fb).length / Math.max(1, dataForCharts.length) * 100,
    ig: dataForCharts.filter((r) => r.ig).length / Math.max(1, dataForCharts.length) * 100,
    tiktok: dataForCharts.filter((r) => r.tiktok).length / Math.max(1, dataForCharts.length) * 100,
    website:
      dataForCharts.filter((r) => r.website).length / Math.max(1, dataForCharts.length) * 100,
  };

  const statusLower = (r: LeadRow) =>
    ((r.statusNotes || "") + (r.callsUpdate || "")).toLowerCase();
  const phConfirmedRows = dataForCharts.filter(
    (r) => r.sourceSheet === "PH Confirmed Merchants"
  );
  const usConfirmedRows = dataForCharts.filter(
    (r) =>
      r.sourceSheet === "US Confirmed Merchants" ||
      (r.sourceSheet === "US New Leads" &&
        (r.result || "").toLowerCase().trim() === "confirmed")
  );
  const cardKpis = {
    total: dataForCharts.length,
    phConfirmed: phConfirmedRows.length,
    sampleReceived: phConfirmedRows.filter(
      (r) => statusLower(r).includes("sample") && statusLower(r).includes("received")
    ).length,
    shippedInTransit: phConfirmedRows.filter(
      (r) =>
        statusLower(r).includes("shipped") || statusLower(r).includes("lbc")
    ).length,
    usConfirmed: usConfirmedRows.length,
    interested: dataForCharts.filter(
      (r) =>
        r.sourceSheet === "Interested Merchants" ||
        r.sourceSheet === "US Interested Merchants"
    ).length,
    usLeads: dataForCharts.filter(
      (r) =>
        r.sourceSheet === "US New Leads" ||
        r.sourceSheet === "US Interested Merchants"
    ).length,
    phLeads: dataForCharts.filter((r) => r.sourceSheet === "PH New Leads").length,
    previousClients: dataForCharts.filter(
      (r) => r.sourceSheet === "Previous Clients"
    ).length,
    awaitingResponse: dataForCharts.filter((r) =>
      statusLower(r).includes("awaiting response")
    ).length,
    noAnswerUnreachable: dataForCharts.filter(
      (r) =>
        statusLower(r).includes("no answer") ||
        statusLower(r).includes("cannot be reached") ||
        statusLower(r).includes("not answering")
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Region filter + Why */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <div className="flex rounded-lg border p-0.5">
            <button
              onClick={() => setCountryFilter("all")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                countryFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCountryFilter("PH")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                countryFilter === "PH"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              PH
            </button>
            <button
              onClick={() => setCountryFilter("US")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                countryFilter === "US"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              US
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards - dynamic by region filter */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.total}</CardTitle>
          </CardHeader>
        </Card>
        {(countryFilter === "all" || countryFilter === "PH") && (
          <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>PH Confirmed</CardDescription>
              <CardTitle className="text-3xl">{cardKpis.phConfirmed}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              {cardKpis.sampleReceived} samples · {cardKpis.shippedInTransit} shipped
            </CardContent>
          </Card>
        )}
        {(countryFilter === "all" || countryFilter === "US") && (
          <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>US Confirmed</CardDescription>
              <CardTitle className="text-3xl">{cardKpis.usConfirmed}</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Interested</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.interested}</CardTitle>
          </CardHeader>
        </Card>
        {(countryFilter === "all" || countryFilter === "US") && (
          <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>US Leads</CardDescription>
              <CardTitle className="text-3xl">{cardKpis.usLeads}</CardTitle>
            </CardHeader>
          </Card>
        )}
        {(countryFilter === "all" || countryFilter === "PH") && (
          <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>PH New Leads</CardDescription>
              <CardTitle className="text-3xl">{cardKpis.phLeads}</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Previous Clients</CardDescription>
            <CardTitle className="text-2xl">{cardKpis.previousClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Response / No Answer</CardDescription>
            <CardTitle className="text-2xl">
              {cardKpis.awaitingResponse} / {cardKpis.noAnswerUnreachable}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pipeline Funnel + Category Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>Lead funnel by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={funnelBarColors[i] ?? BAR_LIGHT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Top categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={categoryBarColors[i] ?? BAR_LIGHT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geo + US Results + Social */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>City/region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCities}
                  layout="vertical"
                  margin={{ left: 4, right: 20, top: 8, bottom: 8 }}
                  barCategoryGap={countryFilter === "PH" ? 16 : 6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={countryFilter === "PH" ? 120 : 80}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
                    {topCities.map((_, i) => (
                      <Cell key={i} fill={topCitiesBarColors[i] ?? BAR_LIGHT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>{resultChartTitle}</CardTitle>
            <CardDescription>Result breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {resultChartData.map((d, i) => (
                      <linearGradient
                        key={d.name}
                        id={`result-${i}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={RESULT_CHART_COLORS[d.name] ?? "#94a3b8"}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={RESULT_CHART_COLORS[d.name] ?? "#94a3b8"}
                          stopOpacity={0.75}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={resultChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {resultChartData.map((_, i) => (
                      <Cell key={i} fill={`url(#result-${i})`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Digital Presence</CardTitle>
            <CardDescription>% with each channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Facebook className="h-4 w-4 shrink-0 text-blue-600" />
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${socialPct.fb}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-sm font-medium">{Math.round(socialPct.fb)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Instagram className="h-4 w-4 shrink-0 text-pink-500" />
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-600 transition-all"
                    style={{ width: `${socialPct.ig}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-sm font-medium">{Math.round(socialPct.ig)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <TikTokIcon className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-black to-gray-700 transition-all"
                    style={{ width: `${socialPct.tiktok}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-sm font-medium">
                {Math.round(socialPct.tiktok)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 shrink-0 text-pililokal-terracotta" />
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pililokal-brown/80 to-pililokal-terracotta transition-all"
                    style={{ width: `${socialPct.website}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-sm font-medium">
                {Math.round(socialPct.website)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Queue */}
      {followUpList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Queue</CardTitle>
            <CardDescription>Merchants needing follow-up (no answer, awaiting, etc.)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {followUpList.map((r) => (
                <div
                  key={`${r.sourceSheet}-${r.merchantName}`}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div>
                    <span className="font-medium">{r.merchantName}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{r.category}</span>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(r)}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Search</CardTitle>
          <CardDescription>Filter and search leads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sheetFilter} onValueChange={setSheetFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sheet" />
              </SelectTrigger>
              <SelectContent>
                {SHEET_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PH">PH</SelectItem>
                <SelectItem value="US">US</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hasEmailFilter} onValueChange={setHasEmailFilter}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Has Email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="yes">Has Email</SelectItem>
                <SelectItem value="no">No Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hasSocialFilter} onValueChange={setHasSocialFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Social" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="yes">Has Social</SelectItem>
                <SelectItem value="no">No Social</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Merchant</th>
                  <th className="px-4 py-2 text-left font-medium">Category</th>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">Address</th>
                  <th className="px-4 py-2 text-left font-medium">Stage</th>
                  <th className="px-4 py-2 text-left font-medium">Social</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((r, i) => (
                  <tr
                    key={`${r.sourceSheet}-${r.merchantName}-${i}`}
                    className="border-b hover:bg-muted/30"
                  >
                    <td className="px-4 py-2 font-medium">{r.merchantName}</td>
                    <td className="px-4 py-2">{r.category || "—"}</td>
                    <td className="px-4 py-2">{r.email || "—"}</td>
                    <td className="max-w-[120px] truncate px-4 py-2" title={r.address}>
                      {r.address || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">{r.stage ?? "—"}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <span className="flex gap-0.5">
                        {r.fb && <Facebook className="h-3.5 w-3.5" />}
                        {r.ig && <Instagram className="h-3.5 w-3.5" />}
                        {r.tiktok && <TikTokIcon className="h-3.5 w-3.5" />}
                        {r.website && <Globe className="h-3.5 w-3.5" />}
                        {!r.fb && !r.ig && !r.tiktok && !r.website && "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setSelectedMerchant(r)}
                        className="text-primary hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <p className="px-4 py-2 text-sm text-muted-foreground">
                Showing 100 of {filtered.length}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedMerchant}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMerchant(null);
            setEditingLead(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedMerchant && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMerchant.merchantName}</DialogTitle>
                <DialogDescription>
                  {selectedMerchant.category} · {selectedMerchant.sourceSheet}
                </DialogDescription>
              </DialogHeader>
              {"id" in selectedMerchant &&
                (selectedMerchant.stage === "Confirmed" || selectedMerchant.stage === "Interested") && (
                  <div className="flex justify-end">
                    <Button
                      disabled={convertLoading}
                      onClick={async () => {
                        const leadId = (selectedMerchant as LeadRow & { id: string }).id;
                        setConvertLoading(true);
                        const result = await convertLeadToMerchantAction(leadId);
                        setConvertLoading(false);
                        if (result.success && "redirect" in result) {
                          setSelectedMerchant(null);
                          router.push(result.redirect);
                        } else if (!result.success && "error" in result) {
                          setEditError(result.error ?? "Convert failed");
                        }
                      }}
                    >
                      {convertLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Convert to Merchant
                    </Button>
                  </div>
                )}
              {editingLead && editingLead.id ? (
                <LeadEditForm
                  lead={editingLead}
                  onCancel={() => {
                    setEditingLead(null);
                    setEditError(null);
                  }}
                  onSaved={(updated) => {
                    setSelectedMerchant(updated);
                    setEditingLead(null);
                    setEditError(null);
                    router.refresh();
                  }}
                  saving={editSaving}
                  setSaving={setEditSaving}
                  error={editError}
                  setError={setEditError}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact</p>
                    <div className="mt-1 flex flex-wrap gap-4">
                      {selectedMerchant.email && (
                        <a
                          href={`mailto:${selectedMerchant.email}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {selectedMerchant.email}
                        </a>
                      )}
                      {selectedMerchant.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {selectedMerchant.contact}
                        </span>
                      )}
                      {selectedMerchant.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {selectedMerchant.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Social</p>
                    <div className="mt-1 flex gap-2">
                      {selectedMerchant.fb && (
                        <a
                          href={selectedMerchant.fb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMerchant.ig && (
                        <a
                          href={selectedMerchant.ig}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMerchant.tiktok && (
                        <a
                          href={selectedMerchant.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <TikTokIcon className="h-4 w-4" />
                          TikTok <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMerchant.website && (
                        <a
                          href={selectedMerchant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {!selectedMerchant.fb &&
                        !selectedMerchant.ig &&
                        !selectedMerchant.tiktok &&
                        !selectedMerchant.website && (
                          <span className="text-muted-foreground">No social links</span>
                        )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Products</p>
                    <p className="mt-1">{selectedMerchant.products || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {selectedMerchant.statusNotes || "—"}
                    </p>
                  </div>
                  {selectedMerchant.callsUpdate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Calls Update</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {selectedMerchant.callsUpdate}
                      </p>
                    </div>
                  )}
                  {selectedMerchant.encodedBy && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Encoded By</p>
                      <p className="mt-1 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {selectedMerchant.encodedBy}
                      </p>
                    </div>
                  )}
                  {selectedMerchant.id && (
                    <div className="mt-6 flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => setEditingLead(selectedMerchant)}
                        className="bg-[#5e3c28] text-white hover:bg-[#4a2f20]"
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!confirm(`Delete "${selectedMerchant.merchantName}"?`)) return;
                          const r = await deleteLeadAction(selectedMerchant.id!);
                          if (r.success) {
                            setSelectedMerchant(null);
                            router.refresh();
                          } else {
                            alert(r.error);
                          }
                        }}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

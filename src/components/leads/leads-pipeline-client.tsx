"use client";

import { useState } from "react";
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
  Info,
} from "lucide-react";

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

const US_RESULT_COLORS: Record<string, string> = {
  Confirmed: "#22c55e",
  Interested: "#eab308",
  "replied but not yet confirmed": "#eab308",
  "No Response": "#ef4444",
  Declined: "#6b7280",
  "Closed or not Qualified": "#6b7280",
  "(blank)": "#94a3b8",
};

export function LeadsPipelineClient({
  data,
  defaultCountry,
}: {
  data: LeadsData;
  defaultCountry?: string;
}) {
  const [search, setSearch] = useState("");
  const [sheetFilter, setSheetFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>(
    defaultCountry === "PH" || defaultCountry === "US" ? defaultCountry : "all"
  );
  const [hasEmailFilter, setHasEmailFilter] = useState<string>("all");
  const [hasSocialFilter, setHasSocialFilter] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<LeadRow | null>(null);

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
  const topCities = Object.entries(geoData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const usLeadsForChart =
    countryFilter === "US"
      ? (data.bySheet["US New Leads"] ?? []).filter((r) => r.country === "US")
      : countryFilter === "PH"
        ? []
        : data.bySheet["US New Leads"] ?? [];
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
        <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Why separate PH & US?</p>
            <p className="mt-0.5 text-xs">
              Different workflows: PH leads (samples, shipping from Philippines) vs US leads
              (stateside outreach, time zones). Each has its own confirmation pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>PH Confirmed</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.phConfirmed}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {cardKpis.sampleReceived} samples · {cardKpis.shippedInTransit} shipped
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>US Confirmed</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.usConfirmed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Interested</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.interested}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>US Leads</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.usLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PH New Leads</CardDescription>
            <CardTitle className="text-3xl">{cardKpis.phLeads}</CardTitle>
          </CardHeader>
        </Card>
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
                  <defs>
                    <linearGradient id="barGradient1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5e3c28" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#d9823e" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
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
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient1)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  />
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
                  <defs>
                    <linearGradient id="barGradient2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5e3c28" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#d9823e" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
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
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient2)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  />
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
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCities} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <defs>
                    <linearGradient id="geoGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5e3c28" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#d9823e" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
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
                  <Bar
                    dataKey="count"
                    fill="url(#geoGradient)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>US Leads Result</CardTitle>
            <CardDescription>Result breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {usResultData.map((d, i) => (
                      <linearGradient
                        key={d.name}
                        id={`us-${i}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={US_RESULT_COLORS[d.name] ?? "#94a3b8"}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={US_RESULT_COLORS[d.name] ?? "#94a3b8"}
                          stopOpacity={0.75}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={usResultData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {usResultData.map((_, i) => (
                      <Cell key={i} fill={`url(#us-${i})`} />
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
                        {r.website && <Globe className="h-3.5 w-3.5" />}
                        {!r.fb && !r.ig && !r.website && "—"}
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
      <Dialog open={!!selectedMerchant} onOpenChange={() => setSelectedMerchant(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedMerchant && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMerchant.merchantName}</DialogTitle>
                <DialogDescription>
                  {selectedMerchant.category} · {selectedMerchant.sourceSheet}
                </DialogDescription>
              </DialogHeader>
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

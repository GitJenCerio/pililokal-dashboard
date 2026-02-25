"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UpdateLeadStatusForm } from "./update-lead-status-form";
import {
  Search,
  AlertCircle,
  ShoppingBag,
  Clock,
  Loader2,
  Upload,
  CheckCircle2,
  LineChart,
  Users,
} from "lucide-react";
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
  addressComplete: boolean;
  completionPercent: number;
  lastUpdatedAt: Date;
  lastUpdatedBy: { name: string } | null;
  attention: boolean;
};

type ConfirmedLeadRow = LeadRow & { id: string };

const statusVariant: Record<ShopifyStatus, "default" | "secondary" | "warning" | "success"> = {
  NOT_STARTED: "secondary",
  IN_PROGRESS: "warning",
  UPLOADED: "default",
  LIVE: "success",
};

const statusLabel: Record<ShopifyStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  UPLOADED: "Uploaded",
  LIVE: "Live",
};

const submissionLabel: Record<SubmissionType, string> = {
  WEBSITE_EXTRACTION: "Website Extraction",
  FB_IG_EXTRACTION: "FB-IG Extraction",
  MERCHANT_SELECTED: "Merchant-Selected",
};

const selectionLabel: Record<SelectionMode, string> = {
  ALL_PRODUCTS: "All Products",
  SELECTED_ONLY: "Selected Only",
};

type LeadsDataResult = import("@/lib/leads-db").LeadsDataResult;

export function DashboardClient({
  confirmedLeads,
  shopifyKpis,
  needsAttentionList,
  leadsData,
  filters,
  userRole,
}: {
  confirmedLeads: ConfirmedLeadRow[];
  shopifyKpis: { total: number; notStarted: number; inProgress: number; uploaded: number; live: number };
  needsAttentionList: MerchantRow[];
  leadsData: LeadsDataResult;
  filters: {
    status?: string;
    submission?: string;
    selection?: string;
    attention?: string;
    search?: string;
  };
  userRole?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard?${next.toString()}`);
  };

  const filtered = confirmedLeads.filter((r) => {
    if (filters.status && (r.shopifyStatus || "NOT_STARTED") !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const name = (r.merchantName || "").toLowerCase();
      const cat = (r.category || "").toLowerCase();
      const prod = (r.products || "").toLowerCase();
      if (!name.includes(q) && !cat.includes(q) && !prod.includes(q)) return false;
    }
    return true;
  });

  const shopifyStatusData = [
    { name: "Not Started", value: shopifyKpis.notStarted, color: "#94a3b8" },
    { name: "In Progress", value: shopifyKpis.inProgress, color: "#f59e0b" },
    { name: "Uploaded", value: shopifyKpis.uploaded, color: "#3b82f6" },
    { name: "Live", value: shopifyKpis.live, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Leads Pipeline (primary - from DB) */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LineChart className="h-5 w-5 text-pililokal-terracotta" />
            Leads Pipeline
          </CardTitle>
          <CardDescription>
            {leadsData.kpis.total > 0 ? (
              <>
                {leadsData.kpis.total} leads in database ·{" "}
                <Link href="/dashboard/leads" className="text-primary hover:underline">
                  View full pipeline
                </Link>
              </>
            ) : (
              <>
                No leads yet.{" "}
                <Link href="/dashboard/leads" className="text-primary hover:underline">
                  Import from Excel
                </Link>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leadsData.kpis.total > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.phConfirmed}</p>
                  <p className="text-xs text-muted-foreground">PH Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.usConfirmed}</p>
                  <p className="text-xs text-muted-foreground">US Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.interested}</p>
                  <p className="text-xs text-muted-foreground">Interested</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.usLeads}</p>
                  <p className="text-xs text-muted-foreground">US Leads</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.phLeads}</p>
                  <p className="text-xs text-muted-foreground">PH Leads</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-2xl font-bold">{leadsData.kpis.previousClients}</p>
                  <p className="text-xs text-muted-foreground">Prev. Clients</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              Import leads from Pililokal_Merchants_Cleaned.xlsx on the{" "}
              <Link href="/dashboard/leads" className="font-medium text-primary hover:underline">
                Leads Pipeline
              </Link>{" "}
              page.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shopify Upload Status (secondary) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-pililokal-brown/5 to-pililokal-terracotta/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5 text-pililokal-brown" />
              Shopify Upload Status
            </CardTitle>
            <CardDescription>Merchant progress on Shopify</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {shopifyStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {shopifyStatusData.map((d, i) => (
                        <linearGradient
                          key={d.name}
                          id={`shopify-${i}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={d.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={d.color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={shopifyStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {shopifyStatusData.map((d, i) => (
                        <Cell key={d.name} fill={`url(#shopify-${i})`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value, entry) => (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards - same as Shopify Updates (confirmed leads) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Total Confirmed</CardDescription>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{shopifyKpis.total}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Not Started</CardDescription>
                <Clock className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{shopifyKpis.notStarted}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>In Progress</CardDescription>
                <Loader2 className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{shopifyKpis.inProgress}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Uploaded</CardDescription>
                <Upload className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{shopifyKpis.uploaded}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Live</CardDescription>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{shopifyKpis.live}</CardTitle>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      {needsAttentionList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Needs Attention
            </CardTitle>
            <CardDescription>
              Merchants with missing required fields or no updates in 7+ days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {needsAttentionList.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded border p-2">
                  <Link
                    href={`/dashboard/merchants/${m.id}`}
                    className="font-medium hover:underline"
                  >
                    {m.name}
                  </Link>
                  <Badge variant={statusVariant[m.shopifyStatus]}>
                    {statusLabel[m.shopifyStatus]}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filters - confirmed merchants (same as Shopify Updates) */}
      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
          <CardDescription>Confirmed leads (PH + US). Filter by status or search.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <form
              className="relative flex flex-1 min-w-[200px]"
              onSubmit={(e) => {
                e.preventDefault();
                const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value ?? "";
                updateFilter("q", v);
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by name, category, products..."
                defaultValue={filters.search}
                className="pl-9"
              />
            </form>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(v) => updateFilter("status", v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Shopify Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(["NOT_STARTED", "IN_PROGRESS", "UPLOADED", "LIVE"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed merchants table (same data as Shopify Updates) */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Sheet</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Products</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No confirmed merchants. Import leads on Leads Pipeline and ensure PH/US Confirmed sheets have data.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{r.merchantName}</td>
                      <td className="px-4 py-2">{r.category || "—"}</td>
                      <td className="px-4 py-2">{r.sourceSheet}</td>
                      <td className="px-4 py-2">
                        <UpdateLeadStatusForm
                          key={`${r.id}-${r.shopifyStatus || "NOT_STARTED"}`}
                          leadId={r.id}
                          currentStatus={r.shopifyStatus || "NOT_STARTED"}
                        />
                      </td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{r.products || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href="/dashboard/leads"
                          className="text-primary text-sm hover:underline"
                        >
                          View in Leads Pipeline
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {confirmedLeads.length} confirmed merchants
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ShoppingBag,
  Search,
  Clock,
  Loader2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import type { ShopifyStatus } from "@/lib/types";
import type { LeadsDataResult } from "@/lib/leads-db";
import type { LeadRow } from "@/lib/leads-data";

const statusLabel: Record<ShopifyStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  UPLOADED: "Uploaded",
  LIVE: "Live",
};

export function ShopifyUpdatesClient({
  leadsData,
  filters,
}: {
  leadsData: LeadsDataResult;
  filters: { status?: string; search?: string; sheet?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sheetFilter = filters.sheet ?? "PH Confirmed Merchants";
  const phConfirmed = leadsData.bySheet["PH Confirmed Merchants"] ?? [];
  const usConfirmed = leadsData.bySheet["US Confirmed Merchants"] ?? [];
  const confirmedLeads: LeadRow[] =
    sheetFilter === "PH Confirmed Merchants"
      ? phConfirmed
      : sheetFilter === "US Confirmed Merchants"
        ? usConfirmed
        : sheetFilter === "confirmed"
          ? [...phConfirmed, ...usConfirmed]
          : [...phConfirmed, ...usConfirmed];

  const filteredLeads = confirmedLeads.filter((r) => {
    if (filters.status) {
      const s = (r.shopifyStatus || "NOT_STARTED") as ShopifyStatus;
      if (s !== filters.status) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !r.merchantName?.toLowerCase().includes(q) &&
        !r.category?.toLowerCase().includes(q) &&
        !r.products?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const kpis = {
    total: confirmedLeads.length,
    notStarted: confirmedLeads.filter(
      (r) => (r.shopifyStatus || "NOT_STARTED") === "NOT_STARTED"
    ).length,
    inProgress: confirmedLeads.filter(
      (r) => (r.shopifyStatus || "NOT_STARTED") === "IN_PROGRESS"
    ).length,
    uploaded: confirmedLeads.filter(
      (r) => (r.shopifyStatus || "NOT_STARTED") === "UPLOADED"
    ).length,
    live: confirmedLeads.filter(
      (r) => (r.shopifyStatus || "NOT_STARTED") === "LIVE"
    ).length,
  };

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/shopify?${next.toString()}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shopify Updates</h1>
      <p className="text-muted-foreground">
        Update Shopify upload status for confirmed leads (PH + US). Click the
        status dropdown to change. Data is stored in the Lead table.
      </p>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Confirmed</CardDescription>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{kpis.total}</CardTitle>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Not Started</CardDescription>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{kpis.notStarted}</CardTitle>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>In Progress</CardDescription>
            <Loader2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{kpis.inProgress}</CardTitle>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Uploaded</CardDescription>
            <Upload className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{kpis.uploaded}</CardTitle>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Live</CardDescription>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{kpis.live}</CardTitle>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmed Leads</CardTitle>
          <CardDescription>
            Filter by sheet (PH/US) or search by name, category, products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <form
              className="relative flex flex-1 min-w-[200px]"
              onSubmit={(e) => {
                e.preventDefault();
                const v =
                  (e.currentTarget.elements.namedItem("q") as HTMLInputElement)
                    ?.value ?? "";
                updateFilter("q", v);
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search leads..."
                defaultValue={filters.search}
                className="pl-9"
              />
            </form>
            <Select
              value={sheetFilter}
              onValueChange={(v) => updateFilter("sheet", v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sheet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PH Confirmed Merchants">
                  PH Confirmed Merchants
                </SelectItem>
                <SelectItem value="US Confirmed Merchants">
                  US Confirmed Merchants
                </SelectItem>
                <SelectItem value="confirmed">All Confirmed (PH + US)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(v) => updateFilter("status", v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Shopify Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(["NOT_STARTED", "IN_PROGRESS", "UPLOADED", "LIVE"] as const).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
          <CardDescription>
            Click the status dropdown in each row to update. Changes save to the
            Lead table and appear on Leads Pipeline.
          </CardDescription>
        </CardHeader>
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
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No confirmed leads. Import leads on Leads Pipeline and
                      ensure PH/US Confirmed sheets have data.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((r) => (
                    <tr key={r.id!} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{r.merchantName}</td>
                      <td className="px-4 py-2">{r.category || "—"}</td>
                      <td className="px-4 py-2">{r.sourceSheet}</td>
                      <td className="px-4 py-2">
                        <UpdateLeadStatusForm
                          key={`${r.id}-${r.shopifyStatus || "NOT_STARTED"}`}
                          leadId={r.id!}
                          currentStatus={r.shopifyStatus || "NOT_STARTED"}
                        />
                      </td>
                      <td className="px-4 py-2 max-w-[200px] truncate">
                        {r.products || "—"}
                      </td>
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
        </CardContent>
      </Card>
    </div>
  );
}

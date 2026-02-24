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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddNoteDialog } from "./add-note-dialog";
import { UpdateStatusForm } from "./update-status-form";
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
  Download,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bulkUpdateStatusAction, bulkDeleteAction } from "@/app/dashboard/merchants/actions";
import type { ShopifyStatus, SubmissionType, SelectionMode } from "@/lib/types";

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
  merchants,
  kpis,
  needsAttentionList,
  leadsData,
  filters,
  userRole,
  pagination,
  cursor,
}: {
  merchants: MerchantRow[];
  kpis: { total: number; notStarted: number; inProgress: number; uploaded: number; live: number };
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
  pagination?: { total: number; nextCursor: string | null; pageSize: number };
  cursor?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const isAdmin = userRole === "ADMIN";

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard?${next.toString()}`);
  };

  const filtered = merchants.filter((m) => {
    if (filters.status && m.shopifyStatus !== filters.status) return false;
    if (filters.submission && m.submissionType !== filters.submission) return false;
    if (filters.selection && m.selectionMode !== filters.selection) return false;
    if (filters.attention === "true" && !m.attention) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.category.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const selectAll = filtered.every((m) => selectedIds.has(m.id));
  const toggleSelectAll = () => {
    if (selectAll) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((m) => m.id)));
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    const result = await bulkUpdateStatusAction(
      Array.from(selectedIds),
      bulkStatus as import("@/lib/types").ShopifyStatus
    );
    setBulkLoading(false);
    if (result.error) alert(result.error);
    else setSelectedIds(new Set());
    router.refresh();
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    const res = await fetch("/api/export/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merchants-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const result = await bulkDeleteAction(Array.from(selectedIds));
    setBulkLoading(false);
    setDeleteConfirmOpen(false);
    if (result.error) alert(result.error);
    else setSelectedIds(new Set());
    router.refresh();
  };

  const shopifyStatusData = [
    { name: "Not Started", value: kpis.notStarted, color: "#94a3b8" },
    { name: "In Progress", value: kpis.inProgress, color: "#f59e0b" },
    { name: "Uploaded", value: kpis.uploaded, color: "#3b82f6" },
    { name: "Live", value: kpis.live, color: "#22c55e" },
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

        {/* KPI Cards - Modern style */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Total Merchants</CardDescription>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{kpis.total}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Not Started</CardDescription>
                <Clock className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{kpis.notStarted}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>In Progress</CardDescription>
                <Loader2 className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{kpis.inProgress}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Uploaded</CardDescription>
                <Upload className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{kpis.uploaded}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Live</CardDescription>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{kpis.live}</CardTitle>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
          <CardDescription>Filter and search</CardDescription>
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
                placeholder="Search merchants..."
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
            <Select
              value={filters.submission ?? "all"}
              onValueChange={(v) => updateFilter("submission", v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Submission Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(["WEBSITE_EXTRACTION", "FB_IG_EXTRACTION", "MERCHANT_SELECTED"] as const).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {submissionLabel[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select
              value={filters.selection ?? "all"}
              onValueChange={(v) => updateFilter("selection", v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Selection Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="ALL_PRODUCTS">All Products</SelectItem>
                <SelectItem value="SELECTED_ONLY">Selected Only</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={filters.attention === "true" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateFilter("attention", filters.attention === "true" ? "" : "true")
              }
            >
              Needs Attention
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              {(["NOT_STARTED", "IN_PROGRESS", "UPLOADED", "LIVE"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkStatus} disabled={!bulkStatus || bulkLoading}>
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportSelected}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          {isAdmin && (
            <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} merchant(s)?</DialogTitle>
            <DialogDescription>
              This cannot be undone. All activity logs and related data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkLoading}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-10 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectAll}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Submission Type</th>
                  <th className="px-4 py-3 text-left font-medium">Selection Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium"># Submitted</th>
                  <th className="px-4 py-3 text-left font-medium"># Uploaded</th>
                  <th className="px-4 py-3 text-left font-medium">Address</th>
                  <th className="px-4 py-3 text-left font-medium">Completion</th>
                  <th className="px-4 py-3 text-left font-medium">Last Updated</th>
                  <th className="px-4 py-3 text-left font-medium">Updated By</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-muted-foreground">
                      No merchants found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-muted/30">
                      <td className="w-10 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleSelect(m.id)}
                          className="h-4 w-4 rounded border-input"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/dashboard/merchants/${m.id}`}
                          className="font-medium hover:underline"
                        >
                          {m.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{m.category || "—"}</td>
                      <td className="px-4 py-2">{submissionLabel[m.submissionType]}</td>
                      <td className="px-4 py-2">{selectionLabel[m.selectionMode]}</td>
                      <td className="px-4 py-2">
                        <UpdateStatusForm merchantId={m.id} currentStatus={m.shopifyStatus} />
                      </td>
                      <td className="px-4 py-2">{m.productsSubmittedCount ?? "—"}</td>
                      <td className="px-4 py-2">{m.productsUploadedCount}</td>
                      <td className="px-4 py-2">
                        <Badge variant={m.addressComplete ? "success" : "destructive"}>
                          {m.addressComplete ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{m.completionPercent}%</td>
                      <td className="px-4 py-2">
                        {new Date(m.lastUpdatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{m.lastUpdatedBy?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/merchants/${m.id}`}>View</Link>
                          </Button>
                          <AddNoteDialog merchantId={m.id} merchantName={m.name} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {pagination.total === 0
                  ? "No merchants"
                  : (() => {
                      const pageParam = searchParams.get("page");
                      const page = cursor
                        ? Math.max(2, parseInt(pageParam ?? "2", 10) || 2)
                        : Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
                      const start = (page - 1) * pagination.pageSize + 1;
                      const end = Math.min((page - 1) * pagination.pageSize + filtered.length, pagination.total);
                      return `Showing ${start}–${end} of ${pagination.total} merchants`;
                    })()}
              </p>
              <div className="flex gap-2">
                {cursor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams.toString());
                      next.delete("cursor");
                      next.delete("page");
                      router.push(`/dashboard?${next.toString()}`);
                    }}
                  >
                    Previous
                  </Button>
                )}
                {pagination.nextCursor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams.toString());
                      next.set("cursor", pagination.nextCursor!);
                      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
                      next.set("page", String(page + 1));
                      router.push(`/dashboard?${next.toString()}`);
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

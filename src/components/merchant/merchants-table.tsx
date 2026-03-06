"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ShopifyStatus } from "@/lib/types";

const STATUS_LABELS: Record<ShopifyStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  UPLOADED: "Uploaded",
  LIVE: "Live",
};

export type ConfirmedMerchantRow = {
  id: string;
  name: string;
  category: string;
  contactName: string | null;
  email: string | null;
  shopifyStatus: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string | null;
  type: "merchant" | "lead";
  sourceSheet?: string;
};

export function MerchantsTable({
  rows,
  currentPage,
  totalPages,
  totalCount,
  searchParams,
}: {
  rows: ConfirmedMerchantRow[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  searchParams: { q: string; status: string; category: string };
}) {
  const router = useRouter();
  const search = useSearchParams();

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(search.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.delete("page");
    router.push(`/dashboard/merchants?${next.toString()}`);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(search.toString());
    next.set("page", String(p));
    router.push(`/dashboard/merchants?${next.toString()}`);
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value ?? "";
    const category = (form.elements.namedItem("category") as HTMLInputElement)?.value ?? "";
    updateParams({ q, category });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          name="q"
          placeholder="Search by name, category, contact, email…"
          defaultValue={searchParams.q}
          className="max-w-sm"
        />
        <Select
          value={searchParams.status || "all"}
          onValueChange={(v) => updateParams({ status: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          name="category"
          placeholder="Category"
          defaultValue={searchParams.category}
          className="w-[140px]"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => updateParams({ q: "", status: "", category: "" })}
        >
          Clear
        </Button>
      </form>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No confirmed merchants.{" "}
                  <Link href="/dashboard/merchants/new" className="underline">
                    Add a merchant
                  </Link>{" "}
                  or import leads on{" "}
                  <Link href="/dashboard/leads" className="underline">
                    Leads Pipeline
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={`${m.type}-${m.id}`} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={m.type === "merchant" ? `/dashboard/merchants/${m.id}` : `/dashboard/leads/${m.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.name}
                    </Link>
                    {m.type === "lead" && (
                      <span className="ml-2 text-xs text-muted-foreground">(lead)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.category || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.contactName || m.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.type === "lead" ? (m.sourceSheet || "—") : "Merchant"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.shopifyStatus === "LIVE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : m.shopifyStatus === "UPLOADED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : m.shopifyStatus === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {STATUS_LABELS[m.shopifyStatus as ShopifyStatus] ?? m.shopifyStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.lastUpdatedAt.toLocaleDateString()}
                    {m.lastUpdatedBy ? ` by ${m.lastUpdatedBy}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 25) + 1}–{Math.min(currentPage * 25, totalCount)} of{" "}
            {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

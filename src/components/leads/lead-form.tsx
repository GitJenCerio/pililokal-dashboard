"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { updateLeadAction } from "@/app/dashboard/leads/actions";
import type { LeadRow } from "@/lib/leads-data";

const SHEET_OPTIONS = [
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

type LeadWithId = LeadRow & { id: string };

export function LeadForm({ lead }: { lead: LeadWithId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
      sourceSheet: (formData.get("sourceSheet") as string) || undefined,
    });
    setLoading(false);
    if (result.success) {
      router.push(`/dashboard/leads/${lead.id}`);
      router.refresh();
    } else {
      setError(result.error ?? "Update failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/leads/${lead.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Edit Lead</h2>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="merchantName">Merchant Name</Label>
            <Input id="merchantName" name="merchantName" defaultValue={lead.merchantName} required />
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
            <Input id="email" name="email" type="email" defaultValue={lead.email ?? ""} />
          </div>
          <div>
            <Label htmlFor="contact">Contact / Phone</Label>
            <Input id="contact" name="contact" defaultValue={lead.contact ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={lead.address ?? ""} />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social & Web</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fb">Facebook</Label>
            <Input id="fb" name="fb" type="url" defaultValue={lead.fb ?? ""} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="ig">Instagram</Label>
            <Input id="ig" name="ig" type="url" defaultValue={lead.ig ?? ""} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="tiktok">TikTok</Label>
            <Input id="tiktok" name="tiktok" type="url" defaultValue={lead.tiktok ?? ""} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={lead.website ?? ""} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sourceSheet">Stage / Source Sheet</Label>
            <select
              id="sourceSheet"
              name="sourceSheet"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={lead.sourceSheet}
            >
              {SHEET_OPTIONS.map((o) => (
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
            <Label htmlFor="statusNotes">Status Notes</Label>
            <Textarea
              id="statusNotes"
              name="statusNotes"
              rows={3}
              className="mt-1"
              defaultValue={lead.statusNotes ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="callsUpdate">Calls Update</Label>
            <Textarea
              id="callsUpdate"
              name="callsUpdate"
              rows={2}
              className="mt-1"
              defaultValue={lead.callsUpdate ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/dashboard/leads/${lead.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

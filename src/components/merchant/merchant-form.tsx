"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveMerchantAction } from "@/app/dashboard/merchants/actions";
import type { Merchant, MerchantProductApproval } from "@prisma/client";
import type { SubmissionType, SelectionMode } from "@/lib/types";

type MerchantWithProducts = Merchant & { approvedProducts: MerchantProductApproval[] };

const submissionOptions: { value: SubmissionType; label: string }[] = [
  { value: "WEBSITE_EXTRACTION", label: "Website Extraction" },
  { value: "FB_IG_EXTRACTION", label: "FB-IG Extraction" },
  { value: "MERCHANT_SELECTED", label: "Merchant-Selected" },
];

const selectionOptions: { value: SelectionMode; label: string }[] = [
  { value: "ALL_PRODUCTS", label: "All Products" },
  { value: "SELECTED_ONLY", label: "Selected Only" },
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

export function MerchantForm({ merchant }: { merchant?: MerchantWithProducts }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await saveMerchantAction(
        merchant?.id ?? null,
        Object.fromEntries(formData.entries()) as Record<string, string>
      );
      if (result?.error) {
        setError(result.error);
      } else {
        router.push(result?.redirect ?? "/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Merchant Info</CardTitle>
          <CardDescription>Basic contact details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="region">Region (PH / US)</Label>
            <select
              id="region"
              name="region"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={
                merchant?.addressCountry?.toLowerCase().includes("philippine")
                  ? "Philippines"
                  : merchant?.addressCountry?.toLowerCase().includes("united")
                    ? "United States"
                    : ""
              }
            >
              <option value="">—</option>
              <option value="Philippines">Philippines (PH)</option>
              <option value="United States">United States (US)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="name">Merchant Name *</Label>
            <Input id="name" name="name" defaultValue={merchant?.name} required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={merchant?.category ?? ""}
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
            <Label htmlFor="contactName">Contact Person</Label>
            <Input id="contactName" name="contactName" defaultValue={merchant?.contactName} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={merchant?.email} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={merchant?.phone} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Source Links</CardTitle>
          <CardDescription>Website, Facebook, Instagram</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="sourceWebsite">Website</Label>
            <Input id="sourceWebsite" name="sourceWebsite" type="url" defaultValue={merchant?.sourceWebsite} />
          </div>
          <div>
            <Label htmlFor="sourceFacebook">Facebook</Label>
            <Input id="sourceFacebook" name="sourceFacebook" type="url" defaultValue={merchant?.sourceFacebook} />
          </div>
          <div>
            <Label htmlFor="sourceInstagram">Instagram</Label>
            <Input id="sourceInstagram" name="sourceInstagram" type="url" defaultValue={merchant?.sourceInstagram} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product Sourcing</CardTitle>
          <CardDescription>Submission type and selection</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="submissionType">Submission Type</Label>
            <select
              id="submissionType"
              name="submissionType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={merchant?.submissionType ?? "MERCHANT_SELECTED"}
            >
              {submissionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="selectionMode">Selection Mode</Label>
            <select
              id="selectionMode"
              name="selectionMode"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={merchant?.selectionMode ?? "SELECTED_ONLY"}
            >
              {selectionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="selectionConfirmed"
              name="selectionConfirmed"
              defaultChecked={merchant?.selectionConfirmed}
              className="h-4 w-4 rounded border"
            />
            <Label htmlFor="selectionConfirmed">Selection Confirmed</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Business and return addresses</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Input id="businessAddress" name="businessAddress" defaultValue={merchant?.businessAddress} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="warehouseAddress">Warehouse Address</Label>
            <Input id="warehouseAddress" name="warehouseAddress" defaultValue={merchant?.warehouseAddress} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="returnAddress">Return Address</Label>
            <Input id="returnAddress" name="returnAddress" defaultValue={merchant?.returnAddress} />
          </div>
          <div>
            <Label htmlFor="addressCountry">Country</Label>
            <Input id="addressCountry" name="addressCountry" defaultValue={merchant?.addressCountry} />
          </div>
          <div>
            <Label htmlFor="addressState">State</Label>
            <Input id="addressState" name="addressState" defaultValue={merchant?.addressState} />
          </div>
          <div>
            <Label htmlFor="addressZip">Zip</Label>
            <Input id="addressZip" name="addressZip" defaultValue={merchant?.addressZip} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Status and other details (can be updated later)</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-2"
            defaultValue={merchant?.notes ?? ""}
            placeholder="Add status, follow-up notes, or other details..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : merchant ? "Save Changes" : "Create Merchant"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

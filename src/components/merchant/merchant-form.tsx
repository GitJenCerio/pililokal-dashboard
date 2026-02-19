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
import type { SubmissionType, SelectionMode, ShopifyStatus } from "@/lib/types";

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

const statusOptions: { value: ShopifyStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "LIVE", label: "Live" },
];

export function MerchantForm({ merchant }: { merchant?: MerchantWithProducts }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState(
    merchant?.approvedProducts.map((p) => ({ name: p.productName, url: p.productUrl ?? "" })) ?? [{ name: "", url: "" }]
  );

  const addProduct = () => setProducts((p) => [...p, { name: "", url: "" }]);
  const removeProduct = (i: number) => setProducts((p) => p.filter((_, j) => j !== i));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const approvedProducts = products
      .filter((p) => p.name.trim())
      .map((p) => ({ productName: p.name.trim(), productUrl: p.url.trim() || undefined }));

    try {
      const result = await saveMerchantAction(
        merchant?.id ?? null,
        Object.fromEntries(formData.entries()) as Record<string, string>,
        approvedProducts
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
            <Label htmlFor="name">Merchant Name *</Label>
            <Input id="name" name="name" defaultValue={merchant?.name} required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" defaultValue={merchant?.category} />
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
          <CardTitle>Shopify Upload</CardTitle>
          <CardDescription>Status and metadata</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shopifyStatus">Shopify Status</Label>
            <select
              id="shopifyStatus"
              name="shopifyStatus"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={merchant?.shopifyStatus ?? "NOT_STARTED"}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="shopifyVendorName">Shopify Vendor Name</Label>
            <Input id="shopifyVendorName" name="shopifyVendorName" defaultValue={merchant?.shopifyVendorName} />
          </div>
          <div>
            <Label htmlFor="shopifyCollection">Collection Assigned</Label>
            <Input id="shopifyCollection" name="shopifyCollection" defaultValue={merchant?.shopifyCollection} />
          </div>
          <div>
            <Label htmlFor="shopifyTags">Tags (comma-separated)</Label>
            <Input id="shopifyTags" name="shopifyTags" defaultValue={merchant?.shopifyTags} placeholder="tag1, tag2" />
          </div>
          <div>
            <Label htmlFor="productsSubmittedCount">Products Submitted</Label>
            <Input
              id="productsSubmittedCount"
              name="productsSubmittedCount"
              type="number"
              min={0}
              defaultValue={merchant?.productsSubmittedCount ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="productsUploadedCount">Products Uploaded</Label>
            <Input
              id="productsUploadedCount"
              name="productsUploadedCount"
              type="number"
              min={0}
              defaultValue={merchant?.productsUploadedCount ?? 0}
            />
          </div>
          <div>
            <Label htmlFor="productsTargetCount">Products Target</Label>
            <Input
              id="productsTargetCount"
              name="productsTargetCount"
              type="number"
              min={0}
              defaultValue={merchant?.productsTargetCount ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product Flags</CardTitle>
          <CardDescription>Extraction and approval</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {[
            "productsExtracted",
            "productsSentForConfirmation",
            "merchantApprovedExtractedList",
            "variantsComplete",
            "pricingAdded",
            "inventoryAdded",
            "skuAdded",
            "imagesComplete",
            "finalReviewed",
          ].map((key) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={key}
                name={key}
                defaultChecked={(merchant as Record<string, unknown>)?.[key] as boolean}
                className="h-4 w-4 rounded border"
              />
              <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</Label>
            </div>
          ))}
          <div>
            <Label htmlFor="approvedAt">Date Approved</Label>
            <Input
              id="approvedAt"
              name="approvedAt"
              type="date"
              defaultValue={merchant?.approvedAt ? new Date(merchant.approvedAt).toISOString().slice(0, 10) : ""}
            />
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
          <div>
            <Label htmlFor="shopifyPhone">Phone (Shopify)</Label>
            <Input id="shopifyPhone" name="shopifyPhone" defaultValue={merchant?.shopifyPhone} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Approved Products</CardTitle>
          <CardDescription>List of approved product names and optional URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {products.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Product name"
                value={p.name}
                onChange={(e) =>
                  setProducts((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], name: e.target.value };
                    return next;
                  })
                }
              />
              <Input
                placeholder="URL (optional)"
                type="url"
                value={p.url}
                onChange={(e) =>
                  setProducts((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], url: e.target.value };
                    return next;
                  })
                }
              />
              <Button type="button" variant="outline" size="icon" onClick={() => removeProduct(i)}>
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addProduct}>
            Add Product
          </Button>
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

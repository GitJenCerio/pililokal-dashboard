"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddNoteDialog } from "@/components/dashboard/add-note-dialog";
import { UpdateStatusForm } from "@/components/dashboard/update-status-form";
import { Check, X } from "lucide-react";
import type { Merchant, User, MerchantProductApproval, ActivityLog } from "@prisma/client";
import type { ShopifyStatus, SubmissionType, SelectionMode } from "@/lib/types";

type MerchantWithRelations = Merchant & {
  lastUpdatedBy: { name: string } | null;
  uploadedBy: { name: string } | null;
  approvedProducts: MerchantProductApproval[];
  activityLogs: (ActivityLog & { user: { name: string } })[];
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

const activityTypeLabel: Record<string, string> = {
  NOTE: "Note",
  STATUS_CHANGE: "Status Change",
  DATA_UPDATE: "Data Update",
};

export function MerchantDetail({
  merchant,
  addressComplete,
  completionPercent,
}: {
  merchant: MerchantWithRelations;
  addressComplete: boolean;
  completionPercent: number;
}) {
  return (
    <div className="space-y-6">
      {/* A) Merchant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Info</CardTitle>
          <CardDescription>Contact and source links</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Merchant Name</p>
            <p>{merchant.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Category</p>
            <p>{merchant.category || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
            <p>{merchant.contactName || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{merchant.email ? <a href={`mailto:${merchant.email}`} className="text-primary hover:underline">{merchant.email}</a> : "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p>{merchant.phone || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Source Links</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {merchant.sourceWebsite && (
                <a href={merchant.sourceWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Website
                </a>
              )}
              {merchant.sourceFacebook && (
                <a href={merchant.sourceFacebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Facebook
                </a>
              )}
              {merchant.sourceInstagram && (
                <a href={merchant.sourceInstagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Instagram
                </a>
              )}
              {!merchant.sourceWebsite && !merchant.sourceFacebook && !merchant.sourceInstagram && "—"}
            </div>
          </div>
          {merchant.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{merchant.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* B) Shopify Upload Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Shopify Upload Tracking</CardTitle>
          <CardDescription>Upload status and Shopify details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <UpdateStatusForm merchantId={merchant.id} currentStatus={merchant.shopifyStatus} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date Uploaded</p>
              <p>{merchant.uploadedAt ? new Date(merchant.uploadedAt).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uploaded By</p>
              <p>{merchant.uploadedBy?.name ?? "—"}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Shopify Vendor Name</p>
              <p>{merchant.shopifyVendorName || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collection Assigned</p>
              <p>{merchant.shopifyCollection || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              <p>{merchant.shopifyTags || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C) Address & Business Details */}
      <Card>
        <CardHeader>
          <CardTitle>Address & Business Details</CardTitle>
          <CardDescription>Shopify-related addresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Address Complete</p>
            <Badge variant={addressComplete ? "success" : "destructive"}>
              {addressComplete ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Address</p>
              <p>{merchant.businessAddress || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Warehouse Address</p>
              <p>{merchant.warehouseAddress || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Return Address</p>
              <p>{merchant.returnAddress || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Country, State, Zip</p>
              <p>{[merchant.addressCountry, merchant.addressState, merchant.addressZip].filter(Boolean).join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone in Shopify</p>
              <p>{merchant.shopifyPhone || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D) Product Sourcing & Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Product Sourcing & Selection</CardTitle>
          <CardDescription>Submission type and approved products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submission Type</p>
              <p>{submissionLabel[merchant.submissionType]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Selection Mode</p>
              <p>{merchant.selectionMode === "ALL_PRODUCTS" ? "All Products" : "Selected Only"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Selection Confirmed</p>
              <p>{merchant.selectionConfirmed ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Products Extracted</p>
              <p>{merchant.productsExtracted ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Products Sent for Confirmation</p>
              <p>{merchant.productsSentForConfirmation ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Merchant Approved Extracted List</p>
              <p>{merchant.merchantApprovedExtractedList ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date Approved</p>
              <p>{merchant.approvedAt ? new Date(merchant.approvedAt).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          {merchant.approvedProducts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved Products</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {merchant.approvedProducts.map((p) => (
                  <li key={p.id}>
                    {p.productUrl ? (
                      <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {p.productName}
                      </a>
                    ) : (
                      p.productName
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* E) Product Upload Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Product Upload Progress</CardTitle>
          <CardDescription>Checklist items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {[
              { label: "Variants Complete", value: merchant.variantsComplete },
              { label: "Pricing Added", value: merchant.pricingAdded },
              { label: "Inventory Added", value: merchant.inventoryAdded },
              { label: "SKU Added", value: merchant.skuAdded },
              { label: "Images Complete", value: merchant.imagesComplete },
              { label: "Final Review", value: merchant.finalReviewed },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 rounded border px-3 py-2">
                {value ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">Completion %</p>
            <p className="text-2xl font-bold">{completionPercent}%</p>
          </div>
        </CardContent>
      </Card>

      {/* F) Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Timeline of updates</CardDescription>
            </div>
            <AddNoteDialog merchantId={merchant.id} merchantName={merchant.name} />
          </div>
        </CardHeader>
        <CardContent>
          {merchant.activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {merchant.activityLogs.map((log) => (
                <div key={log.id} className="flex gap-4 border-l-2 pl-4">
                  <div className="flex-1">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.user.name} · {activityTypeLabel[log.type] ?? log.type} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type {
  SubmissionType,
  SelectionMode,
  ShopifyStatus,
} from "@/lib/types";

export async function saveMerchantAction(
  merchantId: string | null,
  data: Record<string, string | undefined>,
  approvedProducts: { productName: string; productUrl?: string }[]
) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  const name = data.name?.trim();
  if (!name) return { error: "Merchant name is required" };

  const bool = (v: string | undefined) =>
    v === "true" || v === "on" || v === "yes";

  const payload = {
    name,
    category: data.category?.trim() ?? "",
    contactName: data.contactName?.trim() ?? null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    sourceWebsite: data.sourceWebsite?.trim() || null,
    sourceFacebook: data.sourceFacebook?.trim() || null,
    sourceInstagram: data.sourceInstagram?.trim() || null,
    submissionType: (data.submissionType as SubmissionType) ?? "MERCHANT_SELECTED",
    selectionMode: (data.selectionMode as SelectionMode) ?? "SELECTED_ONLY",
    selectionConfirmed: bool(data.selectionConfirmed),
    shopifyStatus: (data.shopifyStatus as ShopifyStatus) ?? "NOT_STARTED",
    shopifyVendorName: data.shopifyVendorName?.trim() || null,
    shopifyCollection: data.shopifyCollection?.trim() || null,
    shopifyTags: data.shopifyTags?.trim() || null,
    productsSubmittedCount: data.productsSubmittedCount
      ? parseInt(data.productsSubmittedCount, 10)
      : null,
    productsUploadedCount: data.productsUploadedCount
      ? parseInt(data.productsUploadedCount, 10)
      : 0,
    productsTargetCount: data.productsTargetCount
      ? parseInt(data.productsTargetCount, 10)
      : null,
    productsExtracted: bool(data.productsExtracted),
    productsSentForConfirmation: bool(data.productsSentForConfirmation),
    merchantApprovedExtractedList: bool(data.merchantApprovedExtractedList),
    approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
    variantsComplete: bool(data.variantsComplete),
    pricingAdded: bool(data.pricingAdded),
    inventoryAdded: bool(data.inventoryAdded),
    skuAdded: bool(data.skuAdded),
    imagesComplete: bool(data.imagesComplete),
    finalReviewed: bool(data.finalReviewed),
    businessAddress: data.businessAddress?.trim() || null,
    warehouseAddress: data.warehouseAddress?.trim() || null,
    returnAddress: data.returnAddress?.trim() || null,
    addressCountry: data.addressCountry?.trim() || null,
    addressState: data.addressState?.trim() || null,
    addressZip: data.addressZip?.trim() || null,
    shopifyPhone: data.shopifyPhone?.trim() || null,
    lastUpdatedById: session.userId,
  };

  if (merchantId) {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: payload,
    });
    await prisma.merchantProductApproval.deleteMany({
      where: { merchantId },
    });
    if (approvedProducts.length > 0) {
      await prisma.merchantProductApproval.createMany({
        data: approvedProducts.map((p) => ({
          merchantId,
          productName: p.productName,
          productUrl: p.productUrl || null,
        })),
      });
    }
    await prisma.activityLog.create({
      data: {
        merchantId,
        userId: session.userId,
        type: "DATA_UPDATE",
        message: "Merchant details updated",
      },
    });
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/merchants/${merchantId}`);
    return { redirect: `/dashboard/merchants/${merchantId}` };
  } else {
    const merchant = await prisma.merchant.create({
      data: payload,
    });
    if (approvedProducts.length > 0) {
      await prisma.merchantProductApproval.createMany({
        data: approvedProducts.map((p) => ({
          merchantId: merchant.id,
          productName: p.productName,
          productUrl: p.productUrl || null,
        })),
      });
    }
    await prisma.activityLog.create({
      data: {
        merchantId: merchant.id,
        userId: session.userId,
        type: "DATA_UPDATE",
        message: "Merchant created",
      },
    });
    revalidatePath("/dashboard");
    return { redirect: `/dashboard/merchants/${merchant.id}` };
  }
}

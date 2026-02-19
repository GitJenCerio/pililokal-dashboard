import type { Merchant } from "@prisma/client";

export function isAddressComplete(merchant: Pick<Merchant, "businessAddress" | "returnAddress" | "addressCountry" | "addressState" | "addressZip">): boolean {
  return !!(
    merchant.businessAddress?.trim() &&
    merchant.returnAddress?.trim() &&
    merchant.addressCountry?.trim() &&
    merchant.addressState?.trim() &&
    merchant.addressZip?.trim()
  );
}

export function computeCompletionPercent(
  merchant: Merchant & { approvedProducts?: { id: string }[] },
): number {
  let total = 0;

  // Address complete: 20%
  total += isAddressComplete(merchant) ? 20 : 0;

  // Products uploaded progress: 40%
  const target = merchant.selectionMode === "SELECTED_ONLY"
    ? (merchant.productsTargetCount ?? merchant.approvedProducts?.length ?? merchant.productsSubmittedCount ?? 1)
    : (merchant.productsTargetCount ?? merchant.productsSubmittedCount ?? 1);
  const uploaded = merchant.productsUploadedCount ?? 0;
  const uploadRatio = target > 0 ? Math.min(uploaded / target, 1) : 0;
  total += uploadRatio * 40;

  // Checklist (variants, pricing, inventory, sku, images): 30% total, 6% each
  const checklistItems = [
    merchant.variantsComplete,
    merchant.pricingAdded,
    merchant.inventoryAdded,
    merchant.skuAdded,
    merchant.imagesComplete,
  ];
  const checklistCount = checklistItems.filter(Boolean).length;
  total += (checklistCount / 5) * 30;

  // Final review: 10%
  total += merchant.finalReviewed ? 10 : 0;

  return Math.round(Math.min(total, 100));
}

export function needsAttention(
  merchant: Merchant,
  addressComplete: boolean,
): boolean {
  if (!addressComplete) return true;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (merchant.lastUpdatedAt < sevenDaysAgo && merchant.shopifyStatus !== "LIVE") return true;
  return false;
}

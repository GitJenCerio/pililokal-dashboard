-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- Paste and run when Prisma migrate hangs with pooler connection

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "sourceWebsite" TEXT,
    "sourceFacebook" TEXT,
    "sourceInstagram" TEXT,
    "submissionType" TEXT NOT NULL DEFAULT 'MERCHANT_SELECTED',
    "selectionMode" TEXT NOT NULL DEFAULT 'SELECTED_ONLY',
    "selectionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "shopifyStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "shopifyVendorName" TEXT,
    "shopifyCollection" TEXT,
    "shopifyTags" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "productsSubmittedCount" INTEGER,
    "productsUploadedCount" INTEGER NOT NULL DEFAULT 0,
    "productsTargetCount" INTEGER,
    "productsExtracted" BOOLEAN NOT NULL DEFAULT false,
    "productsSentForConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "merchantApprovedExtractedList" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "variantsComplete" BOOLEAN NOT NULL DEFAULT false,
    "pricingAdded" BOOLEAN NOT NULL DEFAULT false,
    "inventoryAdded" BOOLEAN NOT NULL DEFAULT false,
    "skuAdded" BOOLEAN NOT NULL DEFAULT false,
    "imagesComplete" BOOLEAN NOT NULL DEFAULT false,
    "finalReviewed" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedById" TEXT,
    "businessAddress" TEXT,
    "warehouseAddress" TEXT,
    "returnAddress" TEXT,
    "addressCountry" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "shopifyPhone" TEXT,
    "notes" TEXT,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantProductApproval" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantProductApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "sourceSheet" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "products" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "address" TEXT,
    "statusNotes" TEXT,
    "fb" TEXT,
    "ig" TEXT,
    "tiktok" TEXT,
    "website" TEXT,
    "encodedBy" TEXT,
    "result" TEXT,
    "callsUpdate" TEXT,
    "followupEmail" TEXT,
    "reachViaSocmed" TEXT,
    "registeredName" TEXT,
    "contactPerson" TEXT,
    "designation" TEXT,
    "authorizedSignatory" TEXT,
    "country" TEXT,
    "city" TEXT,
    "socialScore" INTEGER,
    "stage" TEXT,
    "needsFollowup" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityDates" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopifyStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE INDEX "Merchant_shopifyStatus_idx" ON "Merchant"("shopifyStatus");
CREATE INDEX "Merchant_category_idx" ON "Merchant"("category");
CREATE INDEX "Merchant_lastUpdatedAt_idx" ON "Merchant"("lastUpdatedAt");
CREATE INDEX "Merchant_selectionConfirmed_idx" ON "Merchant"("selectionConfirmed");
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");
CREATE INDEX "Lead_country_idx" ON "Lead"("country");
CREATE INDEX "Lead_stage_country_idx" ON "Lead"("stage", "country");
CREATE INDEX "Lead_shopifyStatus_idx" ON "Lead"("shopifyStatus");
CREATE INDEX "Lead_needsFollowup_idx" ON "Lead"("needsFollowup");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantProductApproval" ADD CONSTRAINT "MerchantProductApproval_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

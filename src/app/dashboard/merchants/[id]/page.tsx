import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAddressComplete, computeCompletionPercent } from "@/lib/merchant-utils";
import { MerchantDetail } from "@/components/merchant/merchant-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: {
      lastUpdatedBy: { select: { name: true } },
      uploadedBy: { select: { name: true } },
      approvedProducts: true,
      activityLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!merchant) notFound();

  const addressComplete = isAddressComplete(merchant);
  const completionPercent = computeCompletionPercent({
    ...merchant,
    approvedProducts: merchant.approvedProducts,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{merchant.name}</h1>
        <Button asChild>
          <Link href={`/dashboard/merchants/${id}/edit`}>Edit</Link>
        </Button>
      </div>

      <MerchantDetail
        merchant={merchant}
        addressComplete={addressComplete}
        completionPercent={completionPercent}
      />
    </div>
  );
}

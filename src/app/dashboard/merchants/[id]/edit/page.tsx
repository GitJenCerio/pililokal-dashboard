import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { MerchantForm } from "@/components/merchant/merchant-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { approvedProducts: true },
  });

  if (!merchant) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/merchants/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Merchant</h1>
      </div>

      <MerchantForm merchant={merchant} />
    </div>
  );
}

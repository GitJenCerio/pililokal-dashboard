import { MerchantForm } from "@/components/merchant/merchant-form";

export default function NewMerchantPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Merchant</h1>
      <MerchantForm />
    </div>
  );
}

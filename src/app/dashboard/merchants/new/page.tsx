import { MerchantForm } from "@/components/merchant/merchant-form";

export default async function NewMerchantPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; category?: string; email?: string; contact?: string }>;
}) {
  const params = await searchParams;
  const hasFromLead =
    (params.name ?? "") ||
    (params.category ?? "") ||
    (params.email ?? "") ||
    (params.contact ?? "");
  const initialFromLead = hasFromLead
    ? {
        name: params.name ?? "",
        category: params.category ?? "",
        email: params.email ?? "",
        contactName: params.contact ?? "",
      }
    : undefined;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Merchant</h1>
      <MerchantForm initialFromLead={initialFromLead} />
    </div>
  );
}

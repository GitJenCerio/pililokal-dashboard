import { loadLeadsFromDb } from "@/lib/leads-db";
import { LeadsPipelineClient } from "@/components/leads/leads-pipeline-client";
import { ImportLeadsButton } from "@/components/leads/import-leads-button";

export default async function LeadsPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const data = await loadLeadsFromDb();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Leads Pipeline</h1>
        <ImportLeadsButton />
      </div>
      {data.allRows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="font-medium">No leads in database</p>
          <p className="mt-1 text-sm">
            Place <code className="rounded bg-muted px-1">Pililokal_Merchants_Cleaned.xlsx</code> in
            the project root, then click &quot;Import from Excel&quot; to load leads into the database.
          </p>
          <div className="mt-4 flex justify-center">
            <ImportLeadsButton />
          </div>
        </div>
      ) : (
        <LeadsPipelineClient data={data} defaultCountry={params.country} />
      )}
    </div>
  );
}

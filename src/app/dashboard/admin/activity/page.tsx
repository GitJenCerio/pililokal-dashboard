import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; merchantId?: string; type?: string }>;
}) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const where = {
    ...(params.merchantId ? { merchantId: params.merchantId } : {}),
    ...(params.type ? { type: params.type } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        merchant: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      <p className="text-muted-foreground mb-4">{total} total entries</p>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Merchant</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {log.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                </td>
                <td className="px-4 py-3">{log.user.name}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/merchants/${log.merchant.id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {log.merchant.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                    {log.type}
                  </span>
                </td>
                <td className="px-4 py-3">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${params.merchantId ? `&merchantId=${params.merchantId}` : ""}${params.type ? `&type=${params.type}` : ""}`}
              className="rounded border px-3 py-1 text-sm hover:bg-muted"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}${params.merchantId ? `&merchantId=${params.merchantId}` : ""}${params.type ? `&type=${params.type}` : ""}`}
              className="rounded border px-3 py-1 text-sm hover:bg-muted"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/");
  }
  return (
    <DashboardLayout user={{ name: session.name, email: session.email, role: session.role }}>
      {children}
    </DashboardLayout>
  );
}

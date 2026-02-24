import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { listUsersAction } from "./actions";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await listUsersAction();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <UsersTable initialUsers={users} />
    </div>
  );
}

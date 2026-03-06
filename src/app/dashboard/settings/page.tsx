import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { ChangePasswordForm } from "./form";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <ChangePasswordForm />
    </div>
  );
}

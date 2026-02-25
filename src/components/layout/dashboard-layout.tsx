import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/logout/action";
import { DashboardNav } from "./dashboard-nav";

export function DashboardLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b bg-card md:w-56 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center justify-center border-b px-4 md:h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Pililokal"
              width={180}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>
        <DashboardNav userRole={user.role} />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:h-16">
          <div className="text-sm text-muted-foreground md:text-base">
            {user.name}
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

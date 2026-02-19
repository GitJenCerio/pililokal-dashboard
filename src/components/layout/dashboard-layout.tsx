import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, LogOut, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/logout/action";

export function DashboardLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b bg-card md:w-56 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center border-b px-4 md:h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Pililokal"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>
        <nav className="flex flex-row gap-2 p-4 md:flex-col md:gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/merchants/new"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Users className="h-4 w-4" />
            Add Merchant
          </Link>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <LineChart className="h-4 w-4" />
            Leads Pipeline
          </Link>
          <Link
            href="/dashboard/leads?country=PH"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            PH Leads
          </Link>
          <Link
            href="/dashboard/leads?country=US"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            US Leads
          </Link>
        </nav>
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

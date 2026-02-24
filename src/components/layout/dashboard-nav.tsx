"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LineChart, ShoppingBag, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/merchants/new", label: "Add Merchant", icon: Users, exact: true },
  { href: "/dashboard/leads", label: "Leads Pipeline", icon: LineChart, exact: false },
  { href: "/dashboard/shopify", label: "Shopify Updates", icon: ShoppingBag, exact: true },
  { href: "/dashboard/admin/users", label: "Users", icon: UserCog, exact: true, adminOnly: true },
];

export function DashboardNav({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-2 p-4 md:flex-col md:gap-1">
      {links.map((link) => {
        if (link.adminOnly && userRole !== "ADMIN") return null;
        const isActive = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent",
              isActive && "bg-accent text-accent-foreground font-semibold"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

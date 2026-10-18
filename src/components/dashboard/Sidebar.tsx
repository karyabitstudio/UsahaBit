"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  File,
  Package,
  Settings,
  LogOut,
  ChartNoAxesCombined,
  UsersRound,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "Invoice", icon: FileText },
  { href: "/dashboard/clients", label: "Client", icon: Users },
  { href: "/dashboard/documents", label: "Surat Resmi", icon: File },
  { href: "/dashboard/products", label: "Produk", icon: Package },
  { href: "/dashboard/reports", label: "Laporan", icon: ChartNoAxesCombined, businessOnly: true },
  { href: "/dashboard/team", label: "Anggota Tim", icon: UsersRound, businessOnly: true },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

interface SidebarProps {
  profile: any;
  isAdmin?: boolean;
}

export function Sidebar({ profile, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const visibleMenuItems = menuItems.filter(
    (item) => !("businessOnly" in item) || isAdmin || profile?.plan === "business",
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b p-4 lg:p-6">
        <Link href="/dashboard">
          <BrandLogo size={42} />
        </Link>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {profile?.business_name || "Bisnis Anda"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </Button>
      </div>
    </aside>
    <div className="sticky top-0 z-40 border-b bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" aria-label="UsahaBit - Dashboard">
          <BrandLogo size={36} />
        </Link>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
      <nav aria-label="Navigasi dashboard" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
    </>
  );
}

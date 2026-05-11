"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu, Waves, Vault, Coins, Droplets, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/swap", label: "Batch swap", icon: Waves },
  { href: "/dashboard/vaults", label: "DLC vaults", icon: Vault },
  { href: "/dashboard/susd", label: "sUSD", icon: Coins },
  { href: "/dashboard/pools", label: "Pools & stake", icon: Droplets },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" data-testid="dashboard-sidebar-nav">
      {links.map((l) => {
        const active =
          l.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            data-testid={`nav-link-${l.href.replace(/\//g, "-")}`}
          >
            <Icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border p-3 lg:hidden">
        <span className="text-sm font-semibold">SatoshiFi</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
          data-testid="sidebar-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <aside
        className={cn(
          "border-border bg-card lg:flex lg:w-60 lg:flex-col lg:border-r",
          open ? "flex max-h-[70vh] flex-col border-b lg:max-h-none" : "hidden lg:flex",
        )}
        data-testid="dashboard-sidebar"
      >
        <div className="hidden border-b border-border p-4 lg:block">
          <Link href="/" className="text-lg font-semibold tracking-tight text-accent">
            SatoshiFi
          </Link>
          <p className="text-xs text-muted-foreground">Bitcoin-native DeFi (mock)</p>
        </div>
        {nav}
      </aside>
    </>
  );
}

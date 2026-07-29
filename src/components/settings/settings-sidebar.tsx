"use client";

import {
  HardDrive,
  Mail,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { settingsNavItems, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  "hard-drive": HardDrive,
  sparkles: Sparkles,
  mail: Mail,
  users: Users,
  settings: Settings,
};

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SettingsNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = iconMap[item.icon] ?? Settings;
  const isActive = item.enabled && isPathActive(pathname, item.href);

  if (!item.enabled) {
    return (
      <div
        className="text-muted-foreground flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap"
        aria-disabled="true"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {item.title}
        </span>
        {item.comingSoon ? (
          <Badge variant="secondary" className="text-[10px] font-normal">
            Soon
          </Badge>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "focus-visible:ring-ring flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/70",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {item.title}
    </Link>
  );
}

export function SettingsSidebar() {
  return (
    <aside className="border-sidebar-border/90 bg-sidebar/80 w-full shrink-0 rounded-2xl border p-3 md:sticky md:top-24 md:w-56 md:self-start">
      <p className="text-muted-foreground px-3 pb-2 text-xs font-medium tracking-[0.14em] uppercase">
        Settings
      </p>
      <nav
        aria-label="Settings sections"
        className="flex gap-1 overflow-x-auto md:flex-col md:space-y-1 md:overflow-visible"
      >
        {settingsNavItems.map((item) => (
          <SettingsNavItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}

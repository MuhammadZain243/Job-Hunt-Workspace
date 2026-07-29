import {
  Briefcase,
  Building2,
  FileText,
  Kanban,
  LayoutDashboard,
  Mail,
  Settings,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { workspaceNavItems, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<NavItem["icon"], LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  briefcase: Briefcase,
  kanban: Kanban,
  users: Users,
  mail: Mail,
  waypoints: Waypoints,
  "file-text": FileText,
  settings: Settings,
};

type SidebarNavProps = {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
};

export function SidebarNav({
  pathname,
  onNavigate,
  className,
}: SidebarNavProps) {
  return (
    <nav aria-label="Workspace" className={cn("space-y-1", className)}>
      {workspaceNavItems.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive =
          item.enabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        if (!item.enabled) {
          return (
            <div
              key={item.href}
              className="text-muted-foreground flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm"
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
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "focus-visible:ring-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2",
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
      })}
    </nav>
  );
}

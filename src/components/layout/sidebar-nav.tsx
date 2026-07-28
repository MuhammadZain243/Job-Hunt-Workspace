import {
  Briefcase,
  Building2,
  FileText,
  Kanban,
  LayoutDashboard,
  Mail,
  Settings,
  Users,
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
              className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground"
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
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
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

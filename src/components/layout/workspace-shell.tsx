"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "@/components/layout/logout-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mobilePrimaryNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

type WorkspaceShellProps = {
  userEmail: string;
  userName: string;
  children: React.ReactNode;
};

export function WorkspaceShell({
  userEmail,
  userName,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,_oklch(0.985_0.008_95)_0%,_oklch(0.97_0.012_230)_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex md:flex-col">
          <div className="mb-6 px-3">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Job Hunt
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-sidebar-foreground">
              Workspace
            </p>
          </div>
          <SidebarNav pathname={pathname} className="flex-1" />
          <div className="mt-auto border-t border-sidebar-border px-3 pt-4">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {userName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4 md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Open navigation"
                    />
                  }
                >
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent side="left" className="w-72 px-3">
                  <SheetHeader className="px-3 text-left">
                    <SheetTitle>Job Hunt Workspace</SheetTitle>
                  </SheetHeader>
                  <SidebarNav
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                    className="mt-4"
                  />
                </SheetContent>
              </Sheet>
              <span className="text-sm font-semibold tracking-tight">
                Workspace
              </span>
            </div>

            <div className="hidden text-sm text-muted-foreground md:block">
              Private owner workspace
            </div>

            <LogoutButton />
          </header>

          <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
            {children}
          </main>

          <nav
            aria-label="Mobile primary"
            className="sticky bottom-0 grid grid-cols-4 border-t border-border bg-background px-2 py-2 md:hidden"
          >
            {mobilePrimaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.enabled ? item.href : "#"}
                aria-disabled={!item.enabled}
                className={cn(
                  "rounded-md px-2 py-2 text-center text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.enabled
                    ? pathname.startsWith(item.href)
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                    : "pointer-events-none text-muted-foreground/60",
                )}
                tabIndex={item.enabled ? 0 : -1}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

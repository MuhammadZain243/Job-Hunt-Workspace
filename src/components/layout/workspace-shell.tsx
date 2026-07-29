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
    <div className="min-h-screen bg-[linear-gradient(165deg,oklch(0.985_0.008_95)_0%,oklch(0.97_0.012_230)_100%)]">
      <div className="flex min-h-screen w-full">
        <aside className="border-sidebar-border/90 bg-sidebar/95 sticky top-0 hidden h-screen w-70 shrink-0 border-r px-4 py-6 md:flex md:flex-col">
          <div className="mb-8 px-3">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
              Job Hunt
            </p>
            <p className="text-sidebar-foreground mt-1 text-xl font-semibold tracking-tight">
              Workspace
            </p>
          </div>
          <SidebarNav pathname={pathname} className="flex-1" />
          <div className="border-sidebar-border mt-auto border-t px-3 pt-5">
            <p className="text-sidebar-foreground truncate text-sm font-medium">
              {userName}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {userEmail}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-border/80 bg-background/92 sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur-sm md:px-8">
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

            <div className="hidden md:block">
              <p className="text-foreground text-sm font-medium">
                Private owner workspace
              </p>
              <p className="text-muted-foreground text-xs">
                Dashboard foundation and navigation shell
              </p>
            </div>

            <LogoutButton />
          </header>

          <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>

          <nav
            aria-label="Mobile primary"
            className="border-border bg-background sticky bottom-0 grid grid-cols-4 border-t px-2 py-2 md:hidden"
          >
            {mobilePrimaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.enabled ? item.href : "#"}
                aria-disabled={!item.enabled}
                className={cn(
                  "focus-visible:ring-ring rounded-md px-2 py-2 text-center text-xs outline-none focus-visible:ring-2",
                  item.enabled
                    ? pathname.startsWith(item.href)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                    : "text-muted-foreground/60 pointer-events-none",
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

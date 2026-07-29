"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type CompanyDetailTabsProps = {
  companyId: string;
  activeTab: "jobs" | "contacts";
  jobCount: number;
  contactCount: number;
};

export function CompanyDetailTabs({
  companyId,
  activeTab,
  jobCount,
  contactCount,
}: CompanyDetailTabsProps) {
  const tabs = [
    { id: "jobs" as const, label: "Jobs", count: jobCount },
    { id: "contacts" as const, label: "Contacts", count: contactCount },
  ];

  return (
    <div
      role="tablist"
      aria-label="Company sections"
      className="border-border/80 flex gap-2 border-b"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={`/companies/${companyId}?tab=${tab.id}`}
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-foreground text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
              {tab.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

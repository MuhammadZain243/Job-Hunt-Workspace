"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";

type CompanyListItem = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  verificationStatus: string;
  jobCount: number;
  contactCount: number;
  applicationCount: number;
};

export function CompanySearchList({
  companies,
}: {
  companies: CompanyListItem[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) =>
      [company.name, company.domain, company.industry]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [companies, query]);

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search companies"
        className="h-10 rounded-xl"
        aria-label="Search companies"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching companies"
          description="Try another search, or create a company above."
        />
      ) : (
        filtered.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="border-border/80 bg-background/70 hover:bg-muted/30 block rounded-2xl border p-4 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{company.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {[company.domain, company.industry]
                    .filter(Boolean)
                    .join(" · ") || "No domain yet"}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {company.jobCount} jobs · {company.contactCount} contacts ·{" "}
                  {company.applicationCount} applications
                </p>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs"
              >
                {company.verificationStatus}
              </Badge>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

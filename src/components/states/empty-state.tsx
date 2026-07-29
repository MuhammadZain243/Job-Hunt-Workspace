import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-muted/30 flex flex-col items-start gap-3 rounded-lg border border-dashed px-6 py-10",
        className,
      )}
      role="status"
    >
      <Inbox className="text-muted-foreground size-5" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="text-foreground text-base font-medium">{title}</h2>
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

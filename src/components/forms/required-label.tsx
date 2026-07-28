import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RequiredLabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
};

export function RequiredLabel({
  htmlFor,
  children,
  required = false,
  className,
}: RequiredLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={cn("gap-1", className)}>
      <span>{children}</span>
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
      {required ? <span className="sr-only">(required)</span> : null}
    </Label>
  );
}

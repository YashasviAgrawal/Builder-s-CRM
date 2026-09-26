import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Inline error panel for failed loads (M01-22). */
export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Please try again.",
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/25 bg-destructive/[0.04] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

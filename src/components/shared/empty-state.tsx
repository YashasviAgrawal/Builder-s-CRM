import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Placeholder for lists and panels with no data (M01-22). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card/70 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="relative flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
          <span
            aria-hidden
            className="absolute -top-1 -right-1 size-3 rounded-full bg-highlight ring-[3px] ring-card"
          />
          <Icon className="size-6" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

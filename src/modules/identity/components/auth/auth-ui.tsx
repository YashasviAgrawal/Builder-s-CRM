import { CircleAlert, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Tall inputs with room for a leading icon, as on the sign-in pages. */
export const authInputClass = "h-11 bg-card pl-10";

export function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-[18px] -translate-y-1/2 text-muted-foreground"
    />
  );
}

export function AuthHeading({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {Icon ? (
        <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon className="size-6" />
        </span>
      ) : null}
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function AuthNotice({
  tone,
  role,
  children,
}: {
  tone: "info" | "error";
  role: "status" | "alert";
  children: ReactNode;
}) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
        tone === "error"
          ? "border-destructive/25 bg-destructive/[0.06] text-destructive"
          : "border-border bg-card text-foreground shadow-card",
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

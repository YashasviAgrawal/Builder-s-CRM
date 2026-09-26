import { ArrowDownRight, ArrowUpRight, type LucideIcon, Minus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatTone = "green" | "blue" | "orange" | "red" | "violet";

const TONES: Record<StatTone, string> = {
  green: "bg-success/10 text-success",
  blue: "bg-accent text-primary",
  orange: "bg-highlight/20 text-highlight-ink",
  red: "bg-destructive/10 text-destructive",
  violet: "bg-[#6d5bd0]/10 text-[#5a48c2] dark:text-[#a99cf0]",
};

/**
 * A figure with its label and the change vs the previous period (M10-02). The change is coloured by whether the
 * direction is good news, and always carries an arrow and a sign — never colour alone.
 */
export function StatTile({
  label,
  value,
  change,
  higherIsBetter = true,
  hint,
  href,
  icon: TileIcon,
  tone = "green",
  className,
}: {
  label: string;
  value: ReactNode;
  /** Percent change vs the previous period; null when there was nothing before. */
  change?: number | null;
  higherIsBetter?: boolean | null;
  hint?: ReactNode;
  href?: string;
  /** Optional icon badge in the tile's corner, tinted by `tone`. */
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
}) {
  const good =
    change === undefined || change === null || change === 0 || higherIsBetter === null
      ? null
      : change > 0 === higherIsBetter;
  const Icon = !change ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[13px] font-medium text-muted-foreground">{label}</p>
        {TileIcon ? (
          <span
            aria-hidden
            className={cn(
              "-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg",
              TONES[tone],
            )}
          >
            <TileIcon className="size-[18px]" />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "text-[28px] leading-none font-semibold tracking-tight",
          TileIcon ? "mt-1.5" : "mt-2.5",
        )}
      >
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {change !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 font-semibold text-muted-foreground tabular-nums",
              good === true && "bg-success/12 text-success",
              good === false && "bg-destructive/10 text-destructive",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {change === null ? "new" : `${change > 0 ? "+" : ""}${change}%`}
            <span className="sr-only"> vs the previous period</span>
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </>
  );
  const tile = "relative block rounded-xl border bg-card p-5 shadow-card";
  return href ? (
    <Link
      href={href}
      className={cn(
        tile,
        "transition-[box-shadow,transform,border-color] duration-200 outline-none hover:-translate-y-0.5 hover:border-border hover:shadow-raised focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cn(tile, className)}>{body}</div>
  );
}

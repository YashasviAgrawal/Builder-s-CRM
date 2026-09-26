"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { appRegistry } from "@/modules/registry";
import type { NavItem, NavSection } from "@/platform/registry/types";

const SECTION_LABELS: Record<NavSection, string | null> = {
  main: null,
  workspace: "Workspace",
  insights: "Insights",
  admin: "Administration",
};

/** Length of the longest route prefix of `item` that matches `pathname` (0 = no match). */
function matchLength(item: Pick<NavItem, "href" | "match">, pathname: string): number {
  return Math.max(
    0,
    ...[item.href, ...(item.match ?? [])].map((prefix) =>
      (prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`))
        ? prefix.length
        : 0,
    ),
  );
}

export function isNavItemActive(item: Pick<NavItem, "href" | "match">, pathname: string): boolean {
  return matchLength(item, pathname) > 0;
}

/**
 * The key of the navigation item for `pathname`: the most specific match wins, so "/leads/unassigned" highlights
 * "Unassigned", not also "Leads".
 */
export function activeNavKey(
  items: readonly Pick<NavItem, "key" | "href" | "match">[],
  pathname: string,
): string | null {
  let best: { key: string; length: number } | null = null;
  for (const item of items) {
    const length = matchLength(item, pathname);
    if (length > 0 && (!best || length > best.length)) best = { key: item.key, length };
  }
  return best?.key ?? null;
}

/** Sidebar navigation built from module manifests and filtered by the user's permissions (M01-21). */
export function NavLinks({
  permissions,
  collapsed = false,
  onNavigate,
}: {
  permissions: readonly string[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const allowed = new Set(permissions);
  const groups = appRegistry.navigation({ has: (key) => allowed.has("*") || allowed.has(key) });
  const activeKey = activeNavKey(
    groups.flatMap((group) => group.items),
    pathname,
  );

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.section} className="flex flex-col gap-0.5">
          {SECTION_LABELS[group.section] && !collapsed ? (
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-sidebar-foreground/65 uppercase">
              {SECTION_LABELS[group.section]}
            </p>
          ) : SECTION_LABELS[group.section] ? (
            <span aria-hidden className="mx-auto mb-1.5 h-px w-6 bg-sidebar-border" />
          ) : null}
          {group.items.map((item) => {
            const active = item.key === activeKey;
            const Icon = item.icon;
            const link = (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/nav relative flex h-9 items-center gap-3 rounded-md px-3 text-[13.5px] font-medium text-sidebar-foreground/85 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50",
                  active && "bg-sidebar-active text-white hover:bg-sidebar-active",
                  collapsed && "justify-center px-0",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors",
                    active
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/60 group-hover/nav:text-sidebar-accent-foreground",
                  )}
                />
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </div>
      ))}
    </nav>
  );
}

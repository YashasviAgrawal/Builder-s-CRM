"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { appRegistry } from "@/modules/registry";

/** Settings navigation built from module manifests, filtered by permissions (M01-24). */
export function SettingsNav({ permissions }: { permissions: readonly string[] }) {
  const pathname = usePathname();
  const allowed = new Set(permissions);
  const groups = appRegistry.settings({ has: (key) => allowed.has("*") || allowed.has(key) });

  return (
    <nav
      aria-label="Settings"
      className="flex gap-6 overflow-x-auto pb-2 lg:flex-col lg:gap-4 lg:overflow-visible"
    >
      {groups.map((group) => (
        <div key={group.group} className="flex shrink-0 flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {group.group}
          </p>
          {group.sections.map((section) => {
            const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
            const Icon = section.icon;
            return (
              <Link
                key={section.key}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
                  active && "bg-card font-medium text-foreground shadow-card ring-1 ring-border",
                )}
              >
                <Icon className={cn("size-4", active && "text-primary")} />
                {section.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

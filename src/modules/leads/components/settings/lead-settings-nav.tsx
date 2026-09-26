"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/leads/statuses", label: "Statuses" },
  { href: "/settings/leads/sources", label: "Sources" },
  { href: "/settings/leads/campaigns", label: "Campaigns" },
  { href: "/settings/leads/duplicates", label: "Duplicates" },
];

export function LeadSettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Lead settings"
      className="mb-6 scrollbar-none inline-flex max-w-full overflow-x-auto rounded-lg border border-border/70 bg-secondary/60 p-[3px]"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
            pathname === tab.href && "bg-card text-foreground shadow-card ring-1 ring-border/50",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

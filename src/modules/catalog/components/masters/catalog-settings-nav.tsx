"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/catalog/property-types", label: "Property types" },
  { href: "/settings/catalog/configuration-types", label: "Configurations" },
  { href: "/settings/catalog/amenities", label: "Amenities" },
];

export function CatalogSettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Project catalogue"
      className="mb-6 inline-flex rounded-lg border border-border/70 bg-secondary/60 p-[3px]"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-card text-foreground shadow-card ring-1 ring-border/50",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

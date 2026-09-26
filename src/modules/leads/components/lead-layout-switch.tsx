"use client";

import { SquareKanban, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/** Table ⇄ pipeline board for the lead list; the view, filters and search come along, paging and sorting do not. */
export function LeadLayoutSwitch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const board = pathname.startsWith("/leads/board");
  const kept = new URLSearchParams(params.toString());
  for (const key of ["page", "pageSize", "sort", "hide", "closed"]) kept.delete(key);
  const query = kept.toString();
  const href = (base: string) => (query ? `${base}?${query}` : base);
  const item =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4";
  const active = "bg-card text-foreground shadow-card ring-1 ring-border/50";
  return (
    <nav
      aria-label="Lead layout"
      className="inline-flex rounded-lg border border-border/70 bg-secondary/60 p-[3px]"
    >
      <Link
        href={href("/leads")}
        aria-current={board ? undefined : "page"}
        className={cn(item, !board && active)}
      >
        <Table2 aria-hidden /> Table
      </Link>
      <Link
        href={href("/leads/board")}
        aria-current={board ? "page" : undefined}
        className={cn(item, board && active)}
      >
        <SquareKanban aria-hidden /> Board
      </Link>
    </nav>
  );
}

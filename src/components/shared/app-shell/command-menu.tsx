"use client";

import { CornerDownLeft, type LucideIcon, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { appRegistry } from "@/modules/registry";

interface Entry {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  href: string;
  group: "Search" | "Pages" | "Settings";
}

const noop = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * "Search or jump to…" (Ctrl/⌘ K): every page and settings section the user may open, from the same registries as
 * the sidebar, plus a lead search when the user can see leads.
 */
export function CommandMenu({ permissions }: { permissions: readonly string[] }) {
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const mac = useSyncExternalStore(noop, isMac, () => false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { pages, settings, canSearchLeads } = useMemo(() => {
    const allowed = new Set(permissions);
    const access = { has: (key: string) => allowed.has("*") || allowed.has(key) };
    const navItems = appRegistry.navigation(access).flatMap((group) => group.items);
    const hasSettings = navItems.some((item) => item.href === "/settings");
    return {
      pages: navItems,
      settings: hasSettings
        ? appRegistry
            .settings(access)
            .flatMap((group) =>
              group.sections.map((section) => ({ ...section, groupLabel: group.group })),
            )
        : [],
      canSearchLeads: navItems.some((item) => item.href === "/leads"),
    };
  }, [permissions]);

  const text = query.trim();
  const needle = text.toLowerCase();
  const matches = (...values: string[]) =>
    !needle || values.some((value) => value.toLowerCase().includes(needle));
  const entries: Entry[] = [
    ...(text && canSearchLeads
      ? [
          {
            key: "search-leads",
            label: `Search leads for “${text}”`,
            hint: "Name, mobile, e-mail or lead number",
            icon: Search,
            href: `/leads?q=${encodeURIComponent(text)}`,
            group: "Search" as const,
          },
        ]
      : []),
    ...pages
      .filter((item) => matches(item.label))
      .map((item) => ({
        key: `page-${item.key}`,
        label: item.label,
        icon: item.icon,
        href: item.href,
        group: "Pages" as const,
      })),
    ...settings
      .filter((section) => matches(section.label, section.description))
      .map((section) => ({
        key: `settings-${section.key}`,
        label: section.label,
        hint: section.groupLabel,
        icon: section.icon,
        href: section.href,
        group: "Settings" as const,
      })),
  ];
  const current = Math.min(active, Math.max(entries.length - 1, 0));

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [open, current, listId]);

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    setOpen(false);
    setQuery("");
    setActive(0);
    router.push(entry.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex size-9 shrink-0 items-center justify-center gap-2.5 rounded-md text-muted-foreground transition-[color,border-color,box-shadow] outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 md:h-9 md:w-72 md:justify-start md:border md:border-input md:bg-background md:pr-1.5 md:pl-3 md:hover:border-foreground/25 lg:w-96"
      >
        <Search className="size-4 shrink-0" />
        <span className="sr-only flex-1 truncate text-left text-sm md:not-sr-only">
          Search or jump to…
        </span>
        <kbd className="hidden h-6 items-center rounded border border-border bg-card px-1.5 font-sans text-[11px] font-medium text-muted-foreground md:inline-flex">
          {mac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery("");
            setActive(0);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl sm:p-0"
        >
          <DialogTitle className="sr-only">Search or jump to</DialogTitle>
          <DialogDescription className="sr-only">
            Type to filter pages and settings; press Enter to open the highlighted one.
          </DialogDescription>
          <div className="flex items-center gap-3 border-b border-border/70 px-5">
            <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={entries.length ? `${listId}-${current}` : undefined}
              aria-autocomplete="list"
              aria-label="Pages, settings and leads"
              placeholder={canSearchLeads ? "Search leads, pages and settings…" : "Jump to…"}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const step = event.key === "ArrowDown" ? 1 : -1;
                  setActive((current + step + entries.length) % Math.max(entries.length, 1));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  go(entries[current]);
                }
              }}
              className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/80"
            />
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground">
              Esc
            </kbd>
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label="Results"
            className="max-h-[min(60vh,26rem)] scrollbar-thin overflow-y-auto p-2"
          >
            {entries.length === 0 ? (
              <li className="px-3 py-10 text-center text-sm text-muted-foreground">
                Nothing matches “{text}”.
              </li>
            ) : null}
            {entries.map((entry, index) => {
              const Icon = entry.icon;
              const first = index === 0 || entries[index - 1]!.group !== entry.group;
              return (
                <li key={entry.key} role="presentation">
                  {first ? (
                    <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      {entry.group}
                    </p>
                  ) : null}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === current}
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(entry)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      index === current && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground",
                        index === current && "border-primary/25 text-primary",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{entry.label}</span>
                      {entry.hint ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.hint}
                        </span>
                      ) : null}
                    </span>
                    {index === current ? (
                      <CornerDownLeft className="size-4 text-muted-foreground" aria-hidden />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

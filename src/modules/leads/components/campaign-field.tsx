"use client";

import { Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { type ComponentProps, useId, useState } from "react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { actionErrorMessage } from "@/lib/action-result";
import { cn } from "@/lib/utils";

import { quickAddCampaignAction } from "../actions";

export interface CampaignOption {
  id: string;
  name: string;
  sourceId: string | null;
}

type Entry = { key: string; label: string; kind: "none" | "campaign" | "create"; id?: string };

/**
 * Campaign picker for the lead form: search the campaigns that fit the chosen source, or — for people who manage
 * lead settings — type a name and add it as a new campaign on the spot. The trigger receives the form control's
 * id and aria attributes, so the field keeps its "Campaign" label.
 */
export function CampaignField({
  value,
  onChange,
  campaigns,
  sourceId,
  canCreate,
  onCreated,
  ...controlProps
}: {
  value: string;
  onChange: (campaignId: string) => void;
  /** Campaigns that fit the lead's source. */
  campaigns: CampaignOption[];
  sourceId: string;
  canCreate: boolean;
  onCreated: (campaign: CampaignOption) => void;
} & Omit<ComponentProps<"button">, "value" | "onChange">) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const quickAdd = useAction(quickAddCampaignAction);

  const selected = campaigns.find((campaign) => campaign.id === value);
  const text = query.trim().replace(/\s+/g, " ");
  const needle = text.toLowerCase();
  const exact = campaigns.some((campaign) => campaign.name.toLowerCase() === needle);
  const entries: Entry[] = [
    ...(needle ? [] : [{ key: "none", label: "No campaign", kind: "none" as const }]),
    ...campaigns
      .filter((campaign) => !needle || campaign.name.toLowerCase().includes(needle))
      .map((campaign) => ({
        key: campaign.id,
        label: campaign.name,
        kind: "campaign" as const,
        id: campaign.id,
      })),
    ...(canCreate && text.length >= 2 && !exact
      ? [{ key: "create", label: text, kind: "create" as const }]
      : []),
  ];
  const current = Math.min(active, Math.max(entries.length - 1, 0));

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  async function choose(entry: Entry | undefined) {
    if (!entry || quickAdd.isPending) return;
    if (entry.kind === "none") onChange("");
    if (entry.kind === "campaign" && entry.id) onChange(entry.id);
    if (entry.kind === "create") {
      const result = await quickAdd.executeAsync({ name: entry.label, sourceId: sourceId || null });
      const error = actionErrorMessage(result);
      if (error || !result?.data) return void toast.error(error ?? "The campaign was not added.");
      const campaign = result.data;
      onCreated({ id: campaign.id, name: campaign.name, sourceId: campaign.sourceId });
      onChange(campaign.id);
      toast.success(
        campaign.created
          ? `Campaign "${campaign.name}" added`
          : `Using the existing campaign "${campaign.name}"`,
      );
    }
    close();
  }

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          {...controlProps}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none hover:border-foreground/25 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive dark:bg-input/20"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.name ?? "No campaign"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).querySelector("input")?.focus();
        }}
      >
        <div className="flex items-center gap-2 border-b border-border/70 px-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={entries.length ? `${listId}-${current}` : undefined}
            aria-autocomplete="list"
            aria-label={canCreate ? "Find or add a campaign" : "Find a campaign"}
            placeholder={canCreate ? "Search or type a new campaign…" : "Search campaigns…"}
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
                void choose(entries[current]);
              }
            }}
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label="Campaigns"
          className="max-h-64 scrollbar-thin overflow-y-auto p-1.5"
        >
          {entries.map((entry, index) => (
            <li
              key={entry.key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={entry.kind !== "create" && (entry.id ?? "") === value}
              onMouseMove={() => setActive(index)}
              onClick={() => void choose(entry)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                index === current && "bg-accent text-accent-foreground",
                entry.kind === "none" && "text-muted-foreground",
              )}
            >
              {entry.kind === "create" ? (
                <>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {quickAdd.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 truncate">
                    Add <span className="font-medium">“{entry.label}”</span> as a new campaign
                  </span>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  {(entry.id ?? "") === value ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </>
              )}
            </li>
          ))}
          {entries.length === 0 ? (
            <li className="px-2.5 py-3 text-sm text-muted-foreground">
              No campaign matches “{text}”.
            </li>
          ) : null}
        </ul>
        {campaigns.length === 0 && !needle ? (
          <p className="border-t border-border/70 px-3.5 py-3 text-xs text-muted-foreground">
            {canCreate ? (
              <>
                No campaigns yet — type a name above to add one, or manage them in{" "}
                <Link
                  href="/settings/leads/campaigns"
                  className="font-medium text-primary hover:underline"
                >
                  Lead settings
                </Link>
                .
              </>
            ) : (
              "No campaigns yet. An administrator can add them in Settings → Lead settings → Campaigns."
            )}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

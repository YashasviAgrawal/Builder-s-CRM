"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";

import { DataTableSelectFilter } from "@/components/shared/data-table";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DATE_RANGE_PRESETS } from "@/lib/date-range";
import { cn } from "@/lib/utils";

type Choice = { value: string; label: string };

const parsers = {
  period: parseAsString,
  from: parseAsString,
  to: parseAsString,
  by: parseAsString,
  executive: parseAsString,
  manager: parseAsString,
  builder: parseAsString,
  project: parseAsString,
  source: parseAsString,
  status: parseAsString,
};

export type FilterKey = "executive" | "manager" | "builder" | "project" | "source" | "status";

/**
 * The one filter row above dashboards and reports (M10-02, M10-08): period presets and custom dates stay in view;
 * bucket size and dimension filters sit behind a "Filters" button, with the applied ones as removable chips.
 * Everything lives in the URL.
 */
export function PeriodFilters({
  preset,
  range,
  presets = DATE_RANGE_PRESETS.map((entry) => entry.value),
  granularity,
  filters = {},
  children,
}: {
  preset: string;
  range: { from: string; to: string };
  presets?: readonly string[];
  granularity?: string;
  filters?: Partial<Record<FilterKey, { label: string; choices: Choice[] }>>;
  children?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useQueryStates(parsers, { shallow: false, startTransition });
  const available = (
    Object.entries(filters) as [FilterKey, { label: string; choices: Choice[] }][]
  ).filter(([, filter]) => filter.choices.length > 0);
  const applied = available
    .map(([key, filter]) => ({
      key,
      label: filter.label,
      choice: filter.choices.find((choice) => choice.value === values[key]),
    }))
    .filter((entry) => entry.choice);
  return (
    <div className="mb-6 space-y-3" aria-busy={pending} data-pending={pending || undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="scrollbar-none inline-flex max-w-full overflow-x-auto rounded-lg border border-border/70 bg-secondary/60 p-[3px]"
          role="group"
          aria-label="Period"
        >
          {DATE_RANGE_PRESETS.filter((entry) => presets.includes(entry.value)).map((entry) => (
            <Button
              key={entry.value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={preset === entry.value}
              className={cn(
                "h-7 px-3 text-muted-foreground",
                preset === entry.value &&
                  "bg-card text-foreground shadow-card ring-1 ring-border/50 hover:bg-card",
              )}
              onClick={() => void setValues({ period: entry.value, from: null, to: null })}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        <DateRangePicker
          className="h-9"
          allowClear={false}
          value={range}
          onChange={(next) =>
            void setValues({ period: null, from: next?.from ?? null, to: next?.to ?? null })
          }
        />
        {granularity || available.length ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal />
                Filters
                {applied.length ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {applied.length}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <p className="text-sm font-semibold">Filters</p>
                {applied.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-2 h-7 px-2.5 text-muted-foreground"
                    onClick={() =>
                      void setValues(Object.fromEntries(applied.map((entry) => [entry.key, null])))
                    }
                  >
                    Clear all
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3.5 p-4">
                {granularity ? (
                  <div className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Show figures</span>
                    <DataTableSelectFilter
                      label="Group by"
                      value={granularity}
                      onChange={(by) => void setValues({ by })}
                      choices={[
                        { value: "day", label: "By day" },
                        { value: "week", label: "By week" },
                        { value: "month", label: "By month" },
                      ]}
                      allLabel="Automatic"
                      className="w-full"
                    />
                  </div>
                ) : null}
                {available.map(([key, filter]) => (
                  <div key={key} className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {filter.label}
                    </span>
                    <DataTableSelectFilter
                      label={`Filter by ${filter.label.toLowerCase()}`}
                      value={values[key]}
                      onChange={(value) => void setValues({ [key]: value })}
                      choices={filter.choices}
                      allLabel={`Any ${filter.label.toLowerCase()}`}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
        {children ? <div className="ml-auto flex gap-2">{children}</div> : null}
      </div>
      {applied.length ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Applied filters">
          {applied.map((entry) => (
            <li
              key={entry.key}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-primary/15 bg-accent pr-1 pl-3 text-xs"
            >
              <span className="text-muted-foreground">{entry.label}:</span>
              <span className="font-medium text-foreground">{entry.choice!.label}</span>
              <button
                type="button"
                onClick={() => void setValues({ [entry.key]: null })}
                className="ml-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-primary/10 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <X className="size-3.5" />
                <span className="sr-only">Remove the {entry.label.toLowerCase()} filter</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

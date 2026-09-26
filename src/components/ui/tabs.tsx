"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `segmented` (default): a compact toggle for switching views or filters.
 * `line`: underlined sections of a page (record pages, profile) — scales to many tabs and scrolls sideways.
 */
type TabsVariant = "segmented" | "line";

const TabsVariantContext = React.createContext<TabsVariant>("segmented");

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = "segmented",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(
          variant === "line"
            ? "scrollbar-none flex w-full items-end justify-start gap-1 overflow-x-auto text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]"
            : "inline-flex h-9 w-fit items-center justify-center rounded-lg border border-border/70 bg-secondary/60 p-[3px] text-muted-foreground",
          className,
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variant === "line"
          ? "h-10 shrink-0 rounded-t-md border-b-2 border-transparent px-3 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=active]:border-primary data-[state=active]:text-foreground"
          : "h-full flex-1 rounded-md border border-transparent px-3 py-1 transition-[color,background-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card data-[state=active]:ring-1 data-[state=active]:ring-border/50 dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };

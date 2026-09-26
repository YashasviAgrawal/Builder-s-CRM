"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * An icon-only button named by `label` (its accessible name and tooltip). Props from an outer `asChild` trigger
 * (dialog, dropdown, link) pass through to the button, so it can be used as any trigger.
 */
export function TooltipIconButton({
  label,
  variant = "ghost",
  size = "icon",
  children,
  ...props
}: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size={size} aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

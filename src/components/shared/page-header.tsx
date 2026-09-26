import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

/** Standard page title block with optional breadcrumbs, description and actions (M01-22). */
export function PageHeader({
  leading,
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  /** Visual before the title block, e.g. a record's avatar. */
  leading?: ReactNode;
  /** Short line above the title (e.g. a greeting). */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbEntry[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const last = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  <BreadcrumbItem>
                    {last || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!last ? <BreadcrumbSeparator /> : null}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_22rem] items-start gap-4">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <div className="min-w-0 flex-1 space-y-1.5">
            {eyebrow ? (
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-highlight" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight md:text-[28px]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-[15px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

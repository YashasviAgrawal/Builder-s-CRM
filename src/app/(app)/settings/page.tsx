import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appRegistry } from "@/modules/registry";
import { getRequestContext } from "@/platform/tenant/request-context";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsIndexPage() {
  const ctx = await getRequestContext();
  const groups = appRegistry.settings(ctx.permissions);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure your organization and how the CRM works."
      />
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.group} className="space-y-3">
            <h2 className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {group.group}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.key}
                    href={section.href}
                    className="group rounded-xl focus-visible:outline-none"
                  >
                    <Card className="h-full transition-[box-shadow,transform,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-raised group-focus-visible:ring-[3px] group-focus-visible:ring-ring/40">
                      <CardHeader>
                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-[18px]" />
                        </div>
                        <CardTitle>{section.label}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LEAD_PERMISSIONS } from "@/modules/leads";
import { LeadBoard } from "@/modules/leads/components/lead-board";
import { LeadLayoutSwitch } from "@/modules/leads/components/lead-layout-switch";
import { LeadViewsBar } from "@/modules/leads/components/lead-views-bar";
import { listLeadBoard } from "@/modules/leads/server/leads";
import {
  loadLeadListExtras,
  loadLeadListParams,
  resolveLeadListRequest,
} from "@/modules/leads/server/list-query";
import { listLeadStatuses, statusPermissions } from "@/modules/leads/server/page-data";
import { listLeadListPresets, listSavedViews } from "@/modules/leads/server/views";
import { requirePermission } from "@/platform/rbac/guard";
import { getRequestContext } from "@/platform/tenant/request-context";

export const metadata: Metadata = { title: "Pipeline board" };

/** Pipeline board: the lead list as status columns, with the same views, filters and search. */
export default async function LeadBoardPage({ searchParams }: PageProps<"/leads/board">) {
  const ctx = await getRequestContext();
  requirePermission(ctx, LEAD_PERMISSIONS.view);
  const search = await searchParams;
  const [params, extras] = await Promise.all([
    loadLeadListParams(searchParams),
    loadLeadListExtras(searchParams),
  ]);
  const { view, query, filters, listOptions } = await resolveLeadListRequest(ctx, params, extras);
  const includeClosed = search.closed === "true";
  const [columns, statuses, savedViews] = await Promise.all([
    listLeadBoard(ctx, query, filters, { includeClosed }),
    listLeadStatuses(ctx),
    listSavedViews(ctx),
  ]);

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Every open lead by stage — drag a card to move it along."
        breadcrumbs={[{ label: "Leads", href: "/leads" }, { label: "Pipeline" }]}
        actions={
          ctx.permissions.has(LEAD_PERMISSIONS.create) ? (
            <Button asChild>
              <Link href="/leads/new">
                <Plus /> New lead
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="space-y-4">
        <LeadViewsBar
          views={listOptions.views}
          current={view}
          savedViews={savedViews}
          presets={listLeadListPresets(ctx)}
          extra={<LeadLayoutSwitch />}
        />
        <LeadBoard
          columns={columns}
          statuses={statuses}
          permissions={statusPermissions(ctx)}
          canChangeStatus={ctx.permissions.has(LEAD_PERMISSIONS.changeStatus)}
          owners={listOptions.owners.map(({ membershipId, name }) => ({ membershipId, name }))}
          now={new Date().toISOString()}
        />
      </div>
    </>
  );
}

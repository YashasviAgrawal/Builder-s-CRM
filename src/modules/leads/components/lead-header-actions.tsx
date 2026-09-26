"use client";

import { Mail, Pencil, Phone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TooltipIconButton } from "@/components/shared/tooltip-icon-button";
import { actionErrorMessage } from "@/lib/action-result";

import { deleteLeadAction } from "../actions";
import type { LeadStatusRow } from "../server/masters";
import { StatusDialog, type StatusPermissions } from "./status-dialog";

/**
 * The lead's own actions on the lead page (M04-07): call, e-mail, edit and delete as compact utilities, and
 * "Change status" as the one primary button of the action bar.
 */
export function LeadHeaderActions({
  lead,
  statuses,
  canChangeStatus,
  canUpdate,
  canDelete,
  statusPermissions,
}: {
  lead: {
    id: string;
    number: string;
    mobile: string | null;
    email: string | null;
    status: {
      id: string;
      key: string;
      category: string;
      isTerminal: boolean;
      label: string;
      color: string;
    };
  };
  statuses: LeadStatusRow[];
  canChangeStatus: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  statusPermissions: StatusPermissions;
}) {
  const router = useRouter();
  return (
    <>
      {lead.mobile ? (
        <TooltipIconButton asChild variant="outline" label={`Call ${lead.mobile}`}>
          <a href={`tel:${lead.mobile}`}>
            <Phone />
          </a>
        </TooltipIconButton>
      ) : null}
      {lead.email ? (
        <TooltipIconButton asChild variant="outline" label={`E-mail ${lead.email}`}>
          <a href={`mailto:${lead.email}`}>
            <Mail />
          </a>
        </TooltipIconButton>
      ) : null}
      {canUpdate ? (
        <TooltipIconButton asChild variant="outline" label="Edit">
          <Link href={`/leads/${lead.id}/edit`}>
            <Pencil />
          </Link>
        </TooltipIconButton>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          trigger={
            <TooltipIconButton
              label="Delete lead"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </TooltipIconButton>
          }
          title={`Delete ${lead.number}?`}
          description="Use this for junk or test leads only. The lead disappears from every list; its history stays in the audit log."
          confirmLabel="Delete lead"
          destructive
          onConfirm={async () => {
            const error = actionErrorMessage(await deleteLeadAction({ leadId: lead.id }));
            if (error) {
              toast.error(error);
              return false;
            }
            toast.success(`${lead.number} deleted`);
            router.push("/leads");
          }}
        />
      ) : null}
      {canChangeStatus ? (
        <>
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <StatusDialog
            statuses={statuses}
            current={lead.status}
            leadIds={[lead.id]}
            permissions={statusPermissions}
          />
        </>
      ) : null}
    </>
  );
}

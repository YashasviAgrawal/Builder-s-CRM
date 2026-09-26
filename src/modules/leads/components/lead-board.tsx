"use client";

import { ArrowRightLeft, CalendarClock, Search, X } from "lucide-react";
import Link from "next/link";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { type DragEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { useFormatters } from "@/components/shared/regional-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn, initials } from "@/lib/utils";

import type { LeadBoardColumn, LeadRow } from "../server/leads";
import type { LeadStatusRow } from "../server/masters";
import { TemperatureBadge } from "./badges";
import { statusChoices, StatusDialog, type StatusPermissions } from "./status-dialog";

const ANY = "__any__";

interface Pending {
  lead: LeadRow;
  targetId: string;
}

function BoardToolbar({ owners }: { owners: { membershipId: string; name: string }[] }) {
  const [, startTransition] = useTransition();
  const [values, setValues] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      owner: parseAsString,
      closed: parseAsBoolean.withDefault(false),
    },
    { shallow: false, startTransition, throttleMs: 400 },
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={values.q}
          placeholder="Search name, mobile, e-mail or lead no."
          aria-label="Search leads"
          className="pl-9"
          onChange={(event) => void setValues({ q: event.target.value || null })}
        />
        {values.q ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
            aria-label="Clear search"
            onClick={() => void setValues({ q: null })}
          >
            <X />
          </Button>
        ) : null}
      </div>
      {owners.length ? (
        <Select
          value={values.owner ?? ANY}
          onValueChange={(value) => void setValues({ owner: value === ANY ? null : value })}
        >
          <SelectTrigger className="w-48" aria-label="Filter by owner">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any owner</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner.membershipId} value={owner.membershipId}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <div className="flex items-center gap-2 px-1">
        <Switch
          id="board-closed"
          checked={values.closed}
          onCheckedChange={(checked) => void setValues({ closed: checked || null })}
        />
        <Label htmlFor="board-closed" className="font-normal">
          Show lost & not interested
        </Label>
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  now,
  draggable,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  lead: LeadRow;
  now: number;
  draggable: boolean;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
  onMove?: () => void;
}) {
  const format = useFormatters();
  const overdue = lead.nextFollowUpAt ? Date.parse(lead.nextFollowUpAt) < now : false;
  const budget =
    lead.budgetMin || lead.budgetMax
      ? [lead.budgetMin, lead.budgetMax]
          .filter(Boolean)
          .map((value) => format.money(value, { compact: true }))
          .join(" – ")
      : null;
  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-card transition-[box-shadow,border-color] hover:border-primary/25 hover:shadow-raised",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/leads/${lead.id}`}
            className="block truncate text-sm font-semibold hover:underline"
            draggable={false}
          >
            {lead.name}
          </Link>
          <p className="font-mono text-[11px] text-muted-foreground">{lead.number}</p>
        </div>
        <TemperatureBadge value={lead.temperature} />
      </div>
      {budget || lead.projects.length ? (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {[budget, lead.projects[0]].filter(Boolean).join(" · ")}
          {lead.projects.length > 1 ? ` +${lead.projects.length - 1}` : ""}
        </p>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-primary"
          >
            {lead.ownerName ? initials(lead.ownerName) : "?"}
          </span>
          <span className="truncate">{lead.ownerName ?? "Unassigned"}</span>
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-xs",
            overdue ? "font-medium text-highlight-ink" : "text-muted-foreground",
          )}
          title={
            lead.nextFollowUpAt ? format.dateTime(lead.nextFollowUpAt) : "No follow-up planned"
          }
        >
          <CalendarClock className="size-3.5" aria-hidden />
          {lead.nextFollowUpAt ? format.relative(lead.nextFollowUpAt) : "None"}
          <span className="sr-only">{overdue ? " (overdue)" : ""}</span>
        </span>
      </div>
      {onMove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMove}
          className="absolute top-2 right-2 size-7 bg-card opacity-0 shadow-xs group-hover:opacity-100 focus-visible:opacity-100"
        >
          <ArrowRightLeft className="size-3.5" />
          <span className="sr-only">Change status of {lead.name}</span>
        </Button>
      ) : null}
    </article>
  );
}

/**
 * Pipeline board (M04 lead list as columns). Drag a card to another column to change its status: the usual status
 * dialog opens with the column's status chosen, so reasons, loss reasons and permissions apply exactly as elsewhere.
 * Each card also has a "change status" button for keyboard users.
 */
export function LeadBoard({
  columns,
  statuses,
  permissions,
  canChangeStatus,
  owners,
  now,
}: {
  columns: LeadBoardColumn[];
  statuses: LeadStatusRow[];
  permissions: StatusPermissions;
  canChangeStatus: boolean;
  owners: { membershipId: string; name: string }[];
  now: string;
}) {
  const [dragging, setDragging] = useState<LeadRow | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const nowMs = Date.parse(now);
  const statusById = new Map(statuses.map((status) => [status.id, status]));

  const currentOf = (lead: LeadRow) => {
    const row = statusById.get(lead.status.id);
    return {
      id: lead.status.id,
      key: lead.status.key,
      category: lead.status.category,
      isTerminal: row?.isTerminal ?? false,
      label: lead.status.label,
      color: lead.status.color,
    };
  };

  function drop(targetId: string) {
    const lead = dragging;
    setDragging(null);
    setOver(null);
    if (!lead || lead.status.id === targetId) return;
    const target = statusById.get(targetId);
    const allowed = statusChoices(statuses, currentOf(lead), permissions).some(
      (status) => status.id === targetId,
    );
    if (!target || !allowed) {
      toast.error(
        target
          ? `Leads move to "${target.label}" through their workflow (calls, visits, bookings) or with extra rights.`
          : "This status is not available.",
      );
      return;
    }
    setPending({ lead, targetId });
  }

  return (
    <div className="space-y-4">
      <BoardToolbar owners={owners} />
      <div className="-mx-4 scrollbar-thin overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-h-[60svh] gap-3">
          {columns.map((column) => {
            const isOver = over === column.status.id && dragging?.status.id !== column.status.id;
            return (
              <section
                key={column.status.id}
                aria-label={`${column.status.label}, ${column.total} leads`}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (over !== column.status.id) setOver(column.status.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                    setOver(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  drop(column.status.id);
                }}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/60 transition-colors",
                  isOver && "border-primary/40 bg-accent ring-2 ring-primary/15",
                )}
              >
                <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: column.status.color }}
                  />
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {column.status.label}
                  </h2>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums ring-1 ring-border">
                    {column.total}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {column.rows.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      now={nowMs}
                      draggable={canChangeStatus}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", lead.id);
                        setDragging(lead);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      onMove={
                        canChangeStatus ? () => setPending({ lead, targetId: "" }) : undefined
                      }
                    />
                  ))}
                  {column.rows.length === 0 ? (
                    <p
                      className={cn(
                        "rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground",
                        isOver && "border-primary/40 text-foreground",
                      )}
                    >
                      {isOver ? `Move to ${column.status.label}` : "No leads"}
                    </p>
                  ) : null}
                  {column.total > column.rows.length ? (
                    <Link
                      href={`/leads?status=${column.status.id}`}
                      className="rounded-md px-2 py-1.5 text-center text-xs font-medium text-primary hover:bg-card"
                    >
                      +{column.total - column.rows.length} more in the list
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {pending ? (
        <StatusDialog
          key={`${pending.lead.id}-${pending.targetId}`}
          statuses={statuses}
          current={currentOf(pending.lead)}
          leadIds={[pending.lead.id]}
          permissions={permissions}
          trigger={null}
          open
          initialStatusId={pending.targetId}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
        />
      ) : null}
    </div>
  );
}

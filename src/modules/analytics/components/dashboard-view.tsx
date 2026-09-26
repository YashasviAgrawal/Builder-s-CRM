import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarX2,
  type LucideIcon,
  Minus,
  PhoneCall,
  ThumbsDown,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SkylineIllustration } from "@/components/shared/brand/skyline-illustration";
import { BarList } from "@/components/shared/charts/bar-list";
import { ColumnChart } from "@/components/shared/charts/column-chart";
import { Funnel } from "@/components/shared/charts/funnel";
import { StatTile, type StatTone } from "@/components/shared/charts/stat-tile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateRangeLabel } from "@/lib/date-range";
import { cn } from "@/lib/utils";

import type { MetricKey } from "../metrics";
import { METRICS } from "../metrics";
import type { DashboardData } from "../server/dashboard";

const n = (value: number) => value.toLocaleString("en-IN");
const pct = (value: number | null) => (value === null ? "—" : `${value}%`);

function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** The role-adaptive dashboard (M10-04 → M10-06). Widgets of other modules follow in `widgets`. */
export function DashboardView({ data, widgets }: { data: DashboardData; widgets: ReactNode }) {
  const { summary, view, pipeline, agenda } = data;
  const current = summary.current;
  const tile = (
    key: MetricKey & keyof typeof summary.change,
    value: ReactNode,
    hint: ReactNode,
    href: string | undefined,
    icon: LucideIcon,
    tone: StatTone,
  ) => (
    <StatTile
      label={METRICS[key].label}
      value={value}
      change={summary.change[key]}
      higherIsBetter={METRICS[key].higherIsBetter}
      hint={hint}
      href={href}
      icon={icon}
      tone={tone}
    />
  );
  const headline = (
    key: MetricKey & keyof typeof summary.change,
    value: number,
    hint?: ReactNode,
    href?: string,
  ) => (
    <HeroFigure
      label={METRICS[key].label}
      value={n(value)}
      change={summary.change[key]}
      higherIsBetter={METRICS[key].higherIsBetter}
      hint={hint}
      href={href}
    />
  );
  const previousLabel = formatDateRangeLabel(summary.previousRange, "d MMM");
  const otherCalls = (values: typeof current) =>
    Math.max(
      0,
      values.calls - values.callsPositive - values.callsNegative - values.callsUnresponsive,
    );

  return (
    <div className="space-y-6">
      <section
        aria-label="Results of the period"
        className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-6 text-white shadow-raised md:p-8"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_130%_at_0%_0%,rgb(86_124_141/0.5),transparent_60%),radial-gradient(55%_90%_at_100%_110%,rgb(255_177_98/0.26),transparent_70%)]"
        />
        <SkylineIllustration
          tone="inverse"
          className="pointer-events-none absolute -right-4 -bottom-px -z-10 hidden w-[380px] opacity-90 xl:block"
        />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 xl:pr-[360px]">
          <p className="text-sm font-medium text-white/80">
            Results · {formatDateRangeLabel(data.period.range, "d MMM")}
          </p>
          <p className="text-xs text-white/65">Changes compare with {previousLabel}.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4 xl:pr-[360px]">
          {headline("leadsAssigned", current.leadsAssigned, `${n(current.leadsCreated)} added`)}
          {headline(
            "visitsCompleted",
            current.visitsCompleted,
            `${n(current.revisitsCompleted)} revisits · ${n(current.visitsNoShow)} no-shows`,
            "/visits",
          )}
          {headline(
            "bookings",
            current.bookings,
            `${pct(current.visitToBooking)} of visits`,
            "/bookings",
          )}
          {headline("closures", current.closures, undefined, "/bookings?status=CLOSED_WON")}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tile(
          "calls",
          n(current.calls),
          `${n(current.callsConnected)} connected · ${pct(current.connectRate)}`,
          "/calls",
          PhoneCall,
          "blue",
        )}
        {tile(
          "followUpsCompleted",
          n(current.followUpsCompleted),
          `${n(current.followUpsDue)} due · ${pct(current.followUpAdherence)} on time`,
          undefined,
          CalendarCheck2,
          "green",
        )}
        {tile(
          "followUpsMissed",
          n(current.followUpsMissed),
          undefined,
          undefined,
          CalendarX2,
          "orange",
        )}
        {tile(
          "lost",
          n(current.lost),
          `${n(current.notInterested)} not interested`,
          "/leads?closure=lost",
          ThumbsDown,
          "red",
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {agenda ? (
          <Section
            title="Today"
            description="Planned for today and still overdue."
            action={
              <Link
                href="/agenda"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium whitespace-nowrap text-primary hover:underline"
              >
                Open agenda <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          >
            <dl className="grid grid-cols-2 gap-2.5 text-sm">
              <Figure label="Follow-ups due" value={agenda.followUpsDue} />
              <Figure label="Callbacks due" value={agenda.callbacksDue} />
              <Figure label="Site visits" value={agenda.visitsToday} />
              <Figure label="Done today" value={agenda.followUpsDone} />
              <Figure label="Overdue" value={agenda.overdue} attention />
            </dl>
          </Section>
        ) : null}
        <Section title="Leads now" description="Where the leads stand, whatever the period.">
          <dl className="grid grid-cols-2 gap-2.5 text-sm">
            <Figure label="Open" value={pipeline.open} href="/leads?open=true" />
            <Figure
              label="Pending"
              value={pipeline.pending}
              attention
              hint="overdue or nothing planned"
            />
            <Figure
              label="Unworked"
              value={pipeline.unworked}
              attention
              hint="no activity since assigned"
            />
            <Figure label="Overdue follow-ups" value={pipeline.overdueFollowUps} attention />
            {pipeline.unassigned !== null ? (
              <Figure
                label="Unassigned"
                value={pipeline.unassigned}
                href="/leads/unassigned"
                attention
              />
            ) : null}
          </dl>
        </Section>
        <Section title="Call outcomes" description="Calls of the period by how they went.">
          <BarList
            title="Call outcomes"
            items={[
              { key: "positive", label: "Positive", values: [current.callsPositive] },
              { key: "negative", label: "Negative", values: [current.callsNegative] },
              { key: "unresponsive", label: "Unresponsive", values: [current.callsUnresponsive] },
              { key: "other", label: "Callback / other", values: [otherCalls(current)] },
            ]}
          />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Calls" description={chartDescription(data)}>
          <ColumnChart
            title="Calls by outcome"
            data={data.series.map((point) => ({
              key: point.key,
              label: point.label,
              values: {
                positive: point.values.callsPositive,
                negative: point.values.callsNegative,
                unresponsive: point.values.callsUnresponsive,
                other: otherCalls(point.values),
              },
            }))}
            series={[
              { key: "positive", label: "Positive", slot: 1 },
              { key: "negative", label: "Negative", slot: 2 },
              { key: "unresponsive", label: "Unresponsive", slot: 3 },
              { key: "other", label: "Callback / other", slot: 4 },
            ]}
          />
        </Section>
        <Section title="Site visits" description={chartDescription(data)}>
          <ColumnChart
            title="Site visits and revisits"
            data={data.series.map((point) => ({
              key: point.key,
              label: point.label,
              values: {
                visits: point.values.visitsCompleted,
                revisits: point.values.revisitsCompleted,
              },
            }))}
            series={[
              { key: "visits", label: "First visits", slot: 1 },
              { key: "revisits", label: "Revisits", slot: 2 },
            ]}
          />
        </Section>
      </div>

      {view !== "OWN" ? <TeamSection data={data} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {data.funnel ? (
          <Section
            title="Lead journey"
            description="Leads created in the period and how far they have come."
          >
            <Funnel
              title="Lead journey"
              steps={[
                { key: "created", label: "Leads", value: data.funnel.created },
                { key: "contacted", label: "Contacted", value: data.funnel.contacted },
                { key: "visited", label: "Visited", value: data.funnel.visited },
                { key: "booked", label: "Booked", value: data.funnel.booked },
                { key: "won", label: "Closed / won", value: data.funnel.won },
              ]}
            />
          </Section>
        ) : null}
        <Section title="Leads by status" description="All leads in scope, by their current status.">
          <BarList
            title="Leads by status"
            items={pipeline.byStatus.map((status) => ({
              key: status.statusId,
              label: status.label,
              values: [status.count],
              href: `/leads?status=${status.statusId}`,
            }))}
            empty="No leads yet."
          />
        </Section>
      </div>

      {view !== "OWN" && data.projects.length ? (
        <Section
          title="Projects"
          description="Visits, bookings and closures of the period by project."
        >
          <BarList
            title="Projects"
            segments={[
              { label: "Visits and revisits", slot: 1 },
              { label: "Bookings", slot: 2 },
            ]}
            items={data.projects.slice(0, 12).map((project) => ({
              key: project.projectId,
              label: project.projectName,
              hint: project.builderName,
              values: [project.visits + project.revisits, project.bookings],
              display: `${n(project.visits + project.revisits)} visits · ${n(project.bookings)} booked · ${n(project.closures)} closed`,
            }))}
          />
        </Section>
      ) : null}

      {view === "ALL" && data.sources.length ? (
        <Section
          title="Lead sources"
          description="Leads created in the period by source, and what came of them."
        >
          <SourceTable sources={data.sources} />
        </Section>
      ) : null}

      {widgets}
    </div>
  );
}

function chartDescription(data: DashboardData) {
  return data.period.range.from === data.period.range.to
    ? "The last 14 days."
    : `Per ${data.period.granularity} of the period.`;
}

/** A headline figure on the dark hero: value, change vs the previous period (arrow + sign, never colour alone). */
function HeroFigure({
  label,
  value,
  change,
  higherIsBetter,
  hint,
  href,
}: {
  label: string;
  value: string;
  change?: number | null;
  higherIsBetter: boolean | null;
  hint?: ReactNode;
  href?: string;
}) {
  const good =
    change === undefined || change === null || change === 0 || higherIsBetter === null
      ? null
      : change > 0 === higherIsBetter;
  const Icon = !change ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const body = (
    <>
      <p className="text-sm text-white/75">{label}</p>
      <p className="mt-1.5 text-4xl leading-none font-semibold tracking-tight">{value}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/65">
        {change !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full bg-white/10 px-1.5 py-0.5 font-semibold text-white/80 tabular-nums",
              good === true && "text-[#a6ecc4]",
              good === false && "text-[#ffc0b3]",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {change === null ? "new" : `${change > 0 ? "+" : ""}${change}%`}
            <span className="sr-only"> vs the previous period</span>
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="-m-3 block rounded-xl p-3 transition-colors outline-none hover:bg-white/[0.07] focus-visible:ring-[3px] focus-visible:ring-white/40"
    >
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

function Figure({
  label,
  value,
  hint,
  href,
  attention,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  attention?: boolean;
}) {
  const warn = attention && value > 0;
  const content = (
    <>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {warn ? <span aria-hidden className="size-1.5 rounded-full bg-highlight" /> : null}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight",
          warn && "text-warning-foreground dark:text-warning",
        )}
      >
        {n(value)}
      </dd>
      {hint ? <dd className="mt-0.5 text-xs text-muted-foreground">{hint}</dd> : null}
    </>
  );
  const panel = cn(
    "block rounded-lg border border-border/70 bg-muted/50 px-3.5 py-3",
    warn && "border-highlight/40 bg-highlight/10",
  );
  return href ? (
    <Link
      href={href}
      className={cn(
        panel,
        "transition-colors hover:border-primary/25 hover:bg-accent/70 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
      )}
    >
      {content}
    </Link>
  ) : (
    <div className={panel}>{content}</div>
  );
}

function TeamSection({ data }: { data: DashboardData }) {
  const members = [...data.members].sort(
    (a, b) =>
      b.values.closures - a.values.closures ||
      b.values.bookings - a.values.bookings ||
      b.values.calls - a.values.calls ||
      a.name.localeCompare(b.name),
  );
  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Section
        title={data.view === "ALL" ? "Team performance" : "My team"}
        description="Ranked by closures, then bookings and calls."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Connect</TableHead>
                <TableHead className="text-right">Follow-ups</TableHead>
                <TableHead className="text-right">On time</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Closed</TableHead>
                <TableHead className="text-right">Lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.memberId}>
                  <TableCell>
                    <Link
                      href={`/reports/executives?executive=${member.memberId}&from=${data.period.range.from}&to=${data.period.range.to}`}
                      className="font-medium hover:underline"
                    >
                      {member.name}
                    </Link>
                    {member.managerName ? (
                      <span className="block text-xs text-muted-foreground">
                        {member.managerName}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n(member.values.calls)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(member.values.connectRate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n(member.values.followUpsCompleted)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(member.values.followUpAdherence)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n(member.values.visitsCompleted + member.values.revisitsCompleted)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n(member.values.bookings)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n(member.values.closures)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{n(member.values.lost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
      <Section title="Call patterns" description="How each member's calls went.">
        <BarList
          title="Call patterns by member"
          segments={[
            { label: "Positive", slot: 1 },
            { label: "Negative", slot: 2 },
            { label: "Unresponsive", slot: 3 },
            { label: "Callback / other", slot: 4 },
          ]}
          items={members
            .filter((member) => member.values.calls > 0)
            .sort((a, b) => b.values.calls - a.values.calls)
            .map((member) => ({
              key: member.memberId,
              label: member.name,
              values: [
                member.values.callsPositive,
                member.values.callsNegative,
                member.values.callsUnresponsive,
                Math.max(
                  0,
                  member.values.calls -
                    member.values.callsPositive -
                    member.values.callsNegative -
                    member.values.callsUnresponsive,
                ),
              ],
            }))}
          empty="No calls in this period."
        />
      </Section>
    </div>
  );
}

function SourceTable({ sources }: { sources: DashboardData["sources"] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Contacted</TableHead>
            <TableHead className="text-right">Visited</TableHead>
            <TableHead className="text-right">Booked</TableHead>
            <TableHead className="text-right">Won</TableHead>
            <TableHead className="text-right">Conversion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow key={source.key}>
              <TableCell className="font-medium">{source.sourceName}</TableCell>
              <TableCell className="text-right tabular-nums">{n(source.created)}</TableCell>
              <TableCell className="text-right tabular-nums">{n(source.contacted)}</TableCell>
              <TableCell className="text-right tabular-nums">{n(source.visited)}</TableCell>
              <TableCell className="text-right tabular-nums">{n(source.booked)}</TableCell>
              <TableCell className="text-right tabular-nums">{n(source.won)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {source.created ? `${Math.round((source.won / source.created) * 1000) / 10}%` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

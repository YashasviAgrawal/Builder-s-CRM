import { CalendarCheck, KeyRound, Users } from "lucide-react";

import { BrandMark } from "@/components/shared/brand/brand-mark";
import { SkylineIllustration } from "@/components/shared/brand/skyline-illustration";
import { resolveDefaultOrganization } from "@/platform/tenant/resolve";

const JOURNEY = [
  { icon: Users, label: "Leads" },
  { icon: CalendarCheck, label: "Site visits" },
  { icon: KeyRound, label: "Bookings" },
] as const;

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" aria-hidden className={className} fill="currentColor">
      <path d="M0 24V14.4C0 6.4 4.3 1.6 11.2 0l1.6 3.4C8.9 4.8 7 7.4 6.8 11H12v13H0Zm19.2 0V14.4C19.2 6.4 23.5 1.6 30.4 0L32 3.4C28.1 4.8 26.2 7.4 26 11h5.2v13h-12Z" />
    </svg>
  );
}

/** Layout for sign-in, forgot-password and reset-password pages: form on the left, brand story on the right. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const organization = await resolveDefaultOrganization().catch(() => null);
  const name = organization?.name ?? "Builder Channel CRM";
  return (
    <main className="flex min-h-svh bg-brand-deep p-2 sm:p-4 lg:p-5">
      <div className="mx-auto grid w-full max-w-[1320px] overflow-hidden rounded-3xl bg-background shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <section className="flex min-h-[calc(100svh-1rem)] flex-col px-6 py-7 sm:min-h-[calc(100svh-2rem)] sm:px-12 lg:min-h-[calc(100svh-2.5rem)] lg:px-16 lg:py-10">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="truncate text-[17px] font-semibold">{name}</span>
          </div>
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[400px] animate-enter">{children}</div>
          </div>
          <p className="text-center text-xs text-muted-foreground lg:text-left">
            Builder Channel CRM · Secure access for your team
          </p>
        </section>

        <section
          aria-label="About Builder Channel CRM"
          className="relative hidden flex-col overflow-hidden bg-[#eef3f7] px-14 pt-16 lg:flex xl:px-20 dark:bg-card"
        >
          <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(255_177_98/0.3),transparent)]" />
          <div className="relative max-w-[540px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-1.5 rounded-full bg-highlight" />
              Real-estate channel partner CRM
            </span>
            <QuoteMark className="mt-10 h-5 w-7 text-highlight-ink" />
            <p className="mt-4 text-[26px] leading-[1.35] font-medium tracking-tight text-foreground xl:text-[28px]">
              Every enquiry, call, site visit and booking in one calm place — so your team always
              knows the next best step.
            </p>
            <div className="mt-4 flex justify-end">
              <QuoteMark className="h-5 w-7 rotate-180 text-highlight-ink" />
            </div>
            <ol className="mt-6 flex flex-wrap items-center gap-2">
              {JOURNEY.map(({ icon: Icon, label }, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-card py-1.5 pr-3.5 pl-1.5 text-sm font-medium shadow-card ring-1 ring-border/70">
                    <span className="flex size-6 items-center justify-center rounded-full bg-accent text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    {label}
                  </span>
                  {index < JOURNEY.length - 1 ? (
                    <span aria-hidden className="h-px w-5 bg-foreground/25" />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
          <SkylineIllustration className="relative mt-auto -mb-px ml-[8%] w-[112%] max-w-none shrink-0" />
        </section>
      </div>
    </main>
  );
}

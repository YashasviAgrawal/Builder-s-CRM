"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import { BrandMark } from "@/components/shared/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { CommandMenu } from "./command-menu";
import { SIDEBAR_COOKIE } from "./constants";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { type ShellUser, UserMenu } from "./user-menu";

export interface AppShellProps {
  organization: { name: string; logoUrl: string | null };
  user: ShellUser;
  permissions: readonly string[];
  defaultCollapsed?: boolean;
  /** Top-bar controls contributed by modules (`app.header.action`). */
  headerActions?: ReactNode;
  /** Messages above the page contributed by modules (`app.banner`). */
  banner?: ReactNode;
  children: ReactNode;
}

function Brand({
  organization,
  collapsed,
}: {
  organization: AppShellProps["organization"];
  collapsed: boolean;
}) {
  return (
    <Link
      href="/dashboard"
      className="flex min-w-0 items-center gap-3 rounded-lg font-semibold text-white outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50"
    >
      {organization.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned URL from object storage
        <img
          src={organization.logoUrl}
          alt=""
          className="size-9 shrink-0 rounded-[10px] bg-white object-contain p-1"
        />
      ) : (
        <BrandMark />
      )}
      {!collapsed ? (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[15px]">{organization.name}</span>
          <span className="truncate text-xs font-medium text-sidebar-foreground/65">
            Channel CRM
          </span>
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Authenticated application layout (M01-20): a navy sidebar (collapsible on desktop/laptop, a slide-over on tablets
 * and phones), a white top bar with search, notifications and the user menu, and the page on a light canvas.
 */
export function AppShell({
  organization,
  user,
  permissions,
  defaultCollapsed = false,
  headerActions,
  banner,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="flex min-h-svh bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-5",
            collapsed && "justify-center px-0",
          )}
        >
          <Brand organization={organization} collapsed={collapsed} />
        </div>
        <div
          className={cn(
            "flex-1 scrollbar-thin overflow-y-auto pt-4 pb-4",
            collapsed ? "px-3" : "px-3",
          )}
        >
          <NavLinks permissions={permissions} collapsed={collapsed} />
        </div>
        <div
          className={cn("border-t border-sidebar-border p-3", collapsed && "flex justify-center")}
        >
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={cn(
              "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/50",
              !collapsed && "h-9 w-full justify-start px-3",
            )}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {!collapsed ? <span>Collapse</span> : null}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 md:px-6 lg:px-8">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-1 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 gap-0 border-none bg-sidebar p-0 text-sidebar-foreground [&>button:last-child]:text-sidebar-foreground [&>button:last-child]:hover:bg-sidebar-accent"
              >
                <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-5">
                  <SheetTitle>
                    <Brand organization={organization} collapsed={false} />
                  </SheetTitle>
                  <SheetDescription className="sr-only">Main navigation</SheetDescription>
                </SheetHeader>
                <div className="scrollbar-thin overflow-y-auto px-3 pt-4 pb-6">
                  <NavLinks permissions={permissions} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1 truncate text-sm font-medium md:hidden">
              {organization.name}
            </div>
            <CommandMenu permissions={permissions} />
            <div className="ml-auto flex items-center gap-1.5">
              {headerActions}
              <ThemeToggle />
              <span aria-hidden className="mx-1.5 hidden h-6 w-px bg-border md:block" />
              <UserMenu user={user} />
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 *:animate-enter md:px-6 lg:px-8 lg:py-8"
          >
            {banner}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

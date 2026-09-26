"use client";

import { ChevronDown, CircleUser, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/utils";

export interface ShellUser {
  name: string;
  email?: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  canOpenSettings?: boolean;
}

/** Signed-in user menu: profile, settings (if permitted) and sign-out. */
export function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 gap-2.5 py-1 pr-2 pl-1 md:pr-3"
          aria-label="Open user menu"
        >
          <Avatar className="size-9 ring-2 ring-card">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-44 flex-col items-start leading-tight md:flex">
            <span className="max-w-full truncate text-sm font-semibold">{user.name}</span>
            {user.subtitle ? (
              <span className="max-w-full truncate text-xs font-normal text-muted-foreground">
                {user.subtitle}
              </span>
            ) : null}
          </span>
          <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="truncate">{user.name}</span>
          {user.email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          ) : null}
          {user.subtitle ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.subtitle}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CircleUser /> My profile
          </Link>
        </DropdownMenuItem>
        {user.canOpenSettings ? (
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={async (event) => {
            event.preventDefault();
            setSigningOut(true);
            await authClient.signOut();
            router.replace("/login?notice=signed-out");
            router.refresh();
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

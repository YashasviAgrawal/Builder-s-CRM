"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

/**
 * Password field with a show/hide toggle. The toggle is named by screen-reader text (not `aria-label`), so the
 * field stays the only element labelled "Password".
 */
function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        <span className="sr-only">Show password</span>
      </button>
    </div>
  );
}

export { PasswordInput };

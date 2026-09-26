import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(27_38_50/0.16)] hover:bg-primary/90 dark:shadow-none",
        destructive:
          "bg-destructive text-white shadow-[0_1px_2px_rgb(80_20_10/0.16)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:shadow-none dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-card shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/20 dark:hover:bg-input/40",
        secondary: "bg-accent text-accent-foreground hover:bg-accent/70",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/60",
        link: "rounded-md text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-5 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

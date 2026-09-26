import { cn } from "@/lib/utils";

/**
 * Product mark: a tower with a pitched roof on a warm tile. Inline SVG (never an `<img>`) so it inherits the
 * theme and is not mistaken for an uploaded organization logo.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#ffc58c] to-[#ffa24a] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_2px_6px_-1px_rgb(255_162_74/0.45)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none">
        <path d="M5 21V9.6L12 4l7 5.6V21z" fill="#1b2632" />
        <path d="M5 21h14" stroke="#1b2632" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="8.4" y="10.4" width="2.4" height="2.4" rx=".5" fill="#ffc58c" />
        <rect x="13.2" y="10.4" width="2.4" height="2.4" rx=".5" fill="#ffc58c" />
        <rect x="8.4" y="14.2" width="2.4" height="2.4" rx=".5" fill="#ffc58c" />
        <rect x="13.2" y="14.2" width="2.4" height="2.4" rx=".5" fill="#ffc58c" />
      </svg>
    </span>
  );
}

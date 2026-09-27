import { cn } from "@/lib/utils";

/**
 * Product mark: a three-tower skyline on a warm tile. Inline SVG (never an `<img>`) so it inherits the theme and
 * is not mistaken for an uploaded organization logo. `src/app/icon.svg` is the same drawing for the browser tab.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#ffcb98] to-[#ff9d42] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-1px_0_rgb(163_81_57/0.22),0_2px_8px_-2px_rgb(255_157_66/0.5)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[66%]" fill="none">
        <path
          d="M2.5 21.5v-9.2c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2v9.2z"
          fill="#1b2632"
        />
        <path d="M16 21.5V9.2c0-.66.54-1.2 1.2-1.2h3.1c.66 0 1.2.54 1.2 1.2v12.3z" fill="#1b2632" />
        <path
          d="M9.3 21.5V6.9c0-.5.27-.95.7-1.2L12 4.5l2 1.2c.43.25.7.7.7 1.2v14.6z"
          fill="#1b2632"
        />
        <g fill="#ffcb98">
          <rect x="4.1" y="13.2" width="1.3" height="1.3" rx=".35" />
          <rect x="4.1" y="16" width="1.3" height="1.3" rx=".35" />
          <rect x="17.6" y="10.2" width="1.3" height="1.3" rx=".35" />
          <rect x="17.6" y="13" width="1.3" height="1.3" rx=".35" />
          <rect x="17.6" y="15.8" width="1.3" height="1.3" rx=".35" />
          <rect x="11.35" y="8.3" width="1.3" height="1.3" rx=".35" />
          <rect x="11.35" y="11.1" width="1.3" height="1.3" rx=".35" />
          <rect x="11.35" y="13.9" width="1.3" height="1.3" rx=".35" />
          <rect x="11.2" y="17.6" width="1.6" height="3.9" rx=".5" />
        </g>
      </svg>
    </span>
  );
}

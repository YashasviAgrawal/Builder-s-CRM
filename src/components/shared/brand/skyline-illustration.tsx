import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const DX = 26;
const DY = -14;
const GROUND = 350;

/** One building in oblique projection: front face, receding right side and roof. */
function Block({
  x1,
  x2,
  top,
  face,
  side = "var(--sky-side)",
  children,
}: {
  x1: number;
  x2: number;
  top: number;
  face: string;
  side?: string;
  children?: ReactNode;
}) {
  return (
    <g>
      <polygon
        points={`${x2},${top} ${x2 + DX},${top + DY} ${x2 + DX},${GROUND} ${x2},${GROUND}`}
        fill={side}
      />
      <polygon
        points={`${x1},${top} ${x2},${top} ${x2 + DX},${top + DY} ${x1 + DX},${top + DY}`}
        fill="var(--sky-roof)"
      />
      <rect x={x1} y={top} width={x2 - x1} height={GROUND - top} fill={face} />
      {children}
    </g>
  );
}

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/**
 * Line-art skyline (decorative). Colours follow the theme through CSS variables; `inverse` draws light lines for
 * dark surfaces such as the dashboard hero.
 */
export function SkylineIllustration({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverse";
}) {
  return (
    <svg
      viewBox="0 0 640 360"
      aria-hidden
      className={cn(
        tone === "inverse"
          ? "[--sky-accent:#ffb162] [--sky-face:rgb(255_255_255/0.04)] [--sky-ink:rgb(200_217_230/0.6)] [--sky-mint:rgb(200_217_230/0.14)] [--sky-roof:rgb(255_255_255/0.08)] [--sky-sand:rgb(255_177_98/0.2)] [--sky-side:rgb(255_255_255/0.07)]"
          : [
              "[--sky-accent:#ffa24a] [--sky-face:#ffffff] [--sky-ink:#2f4156] [--sky-mint:#c8d9e6] [--sky-roof:#f5efeb] [--sky-sand:#ffd9b0] [--sky-side:#e3edf4]",
              "dark:[--sky-accent:#ffb162] dark:[--sky-face:#1c2733] dark:[--sky-ink:#a9c7dd] dark:[--sky-mint:#243b52] dark:[--sky-roof:#202c39] dark:[--sky-sand:#4a3824] dark:[--sky-side:#18222d]",
            ],
        className,
      )}
      preserveAspectRatio="xMidYMax meet"
      fill="none"
    >
      {/* Sun and birds */}
      <circle cx="112" cy="96" r="28" fill="var(--sky-accent)" opacity="0.9" />
      <g stroke="var(--sky-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M188 70l7 6 7-6" />
        <path d="M212 54l5 4 5-4" />
      </g>

      <g stroke="var(--sky-ink)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* Tall tower with vertical window slits (focal) */}
        <Block x1={300} x2={372} top={44} face="var(--sky-sand)">
          <g strokeWidth="3.5" strokeDasharray="24 11">
            {range(314, 358, 11).map((x) => (
              <path key={x} d={`M${x} 66V330`} />
            ))}
          </g>
          <path d="M336 30V8" />
          <path d="M336 9l16 6-16 6" fill="var(--sky-accent)" />
        </Block>

        {/* Left tower with hatched windows */}
        <Block x1={176} x2={270} top={128} face="var(--sky-face)">
          {range(150, 300, 36).map((y) =>
            range(190, 244, 27).map((x) => (
              <g key={`${x}-${y}`} strokeWidth="3">
                <path d={`M${x} ${y + 20}l9 -20`} />
                <path d={`M${x + 8} ${y + 20}l9 -20`} />
              </g>
            )),
          )}
        </Block>

        {/* Low building with ribbon windows */}
        <Block x1={36} x2={150} top={220} face="var(--sky-face)">
          {range(242, 306, 32).map((y) => (
            <rect
              key={y}
              x={52}
              y={y}
              width={82}
              height={14}
              rx={3}
              fill="var(--sky-mint)"
              strokeWidth="3"
            />
          ))}
        </Block>

        {/* Right block with a window grid */}
        <Block x1={412} x2={520} top={158} face="var(--sky-face)">
          {range(182, 290, 36).map((y) =>
            range(428, 492, 32).map((x) => (
              <g key={`${x}-${y}`} strokeWidth="3">
                <rect x={x} y={y} width={16} height={20} rx={2} fill="var(--sky-mint)" />
                <path d={`M${x + 8} ${y}v20`} />
              </g>
            )),
          )}
          <rect
            x={452}
            y={306}
            width={28}
            height={44}
            rx={3}
            fill="var(--sky-roof)"
            strokeWidth="3"
          />
        </Block>

        {/* Glass pavilion */}
        <Block x1={562} x2={622} top={240} face="var(--sky-mint)" side="var(--sky-mint)">
          <g strokeWidth="3">
            {range(576, 610, 15).map((x) => (
              <path key={x} d={`M${x} 240V350`} />
            ))}
            <path d="M562 286h60" />
          </g>
        </Block>

        {/* Trees */}
        <g strokeWidth="3.5">
          <path d="M284 350v-22" />
          <circle cx="284" cy="318" r="17" fill="var(--sky-mint)" />
          <path d="M392 350v-18" />
          <circle cx="392" cy="318" r="14" fill="var(--sky-mint)" />
          <path d="M160 350v-16" />
          <circle cx="160" cy="322" r="12" fill="var(--sky-mint)" />
          <path d="M542 350v-16" />
          <circle cx="542" cy="322" r="13" fill="var(--sky-mint)" />
        </g>

        {/* Ground */}
        <path d="M8 350h624" />
      </g>
    </svg>
  );
}

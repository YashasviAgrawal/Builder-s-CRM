import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { Providers } from "@/components/providers";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Builder Channel CRM";

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "Lead, sales and channel-partner management for real-estate builders and projects.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18222d" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce generated per request in src/proxy.ts (Content-Security-Policy).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}

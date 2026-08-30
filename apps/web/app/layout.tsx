import "./globals.css";
import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import { ThemeProvider } from "@mct/ui/providers/ThemeProvider";
import { VersionBadge } from "@/components/version-badge";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Maine CyberTech Portal",
  description: "Secure MSP client and admin portal",
  applicationName: "MCT Portal",
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${orbitron.variable} font-inter cyber-page-bg antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="pointer-events-none fixed left-1/2 top-[20%] -z-10 h-[800px] w-[800px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(5,150,105,0.08)_0%,transparent_60%)]" />
        <ThemeProvider defaultTheme="system" storageKey="mct-theme">
          <main id="main-content">{children}</main>
          <VersionBadge />
        </ThemeProvider>
      </body>
    </html>
  );
}

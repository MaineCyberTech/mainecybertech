import "./globals.css";
import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron"
});

export const metadata: Metadata = {
  title: "Maine CyberTech Portal",
  description: "Secure MSP client and admin portal",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${orbitron.variable} font-inter cyber-page-bg antialiased`}
      >
        <div className="fixed left-1/2 top-[20%] -z-10 h-[800px] w-[800px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(5,150,105,0.08)_0%,transparent_60%)] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
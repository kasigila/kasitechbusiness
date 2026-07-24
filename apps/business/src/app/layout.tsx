import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Space_Grotesk } from "next/font/google";
import "@kasitech/ui/styles.css";
import "./globals.css";

const sans = Space_Grotesk({
  variable: "--font-kasi-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Outfit({
  variable: "--font-kasi-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-kasi-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KasiTech Business",
    template: "%s · KasiTech Business",
  },
  description: "Your business. One platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meadowfar — an open world for kids, right in the browser",
  description:
    "An endless meadow with quests that never run out. Safe for kids, no downloads, no ads. Padang rumput tanpa tepi, aman untuk anak.",
  applicationName: "Meadowfar",
  appleWebApp: { capable: true, title: "Meadowfar", statusBarStyle: "default" },
  openGraph: {
    title: "Meadowfar — an open world for kids",
    description: "An endless meadow with quests that never run out. Safe, free, no downloads.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

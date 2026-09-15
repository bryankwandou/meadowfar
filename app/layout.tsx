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
  title: "Meadowfar | A free 3D open world for kids, in the browser",
  description:
    "An endless 3D meadow for kids: explore six biomes, play with up to 12 friends in a private room, and dress up with coins earned by playing. No downloads, no ads, no real-money purchases, no loot boxes.",
  applicationName: "Meadowfar",
  appleWebApp: { capable: true, title: "Meadowfar", statusBarStyle: "default" },
  openGraph: {
    title: "Meadowfar | A free 3D open world for kids",
    description: "Explore, build a tree house and play with friends. Safe, free, no downloads, no ads.",
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

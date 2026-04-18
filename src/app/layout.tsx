import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/session-provider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const gatwick = localFont({
  src: [
    { path: "../../public/Gatwick/Gatwick-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/Gatwick/Gatwick-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/Gatwick/Gatwick-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/Gatwick/Gatwick-Ultrabold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-gatwick",
  display: "swap",
  preload: true,
  fallback: ["Inter", "Arial", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: "#FF5A1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SuperFinz — Gen Z Finance Dashboard",
  description: "All-in-one finance dashboard for students and young professionals. Track spends, crush savings goals, and plan your retirement early.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SuperFinz",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png",   sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "SuperFinz — Gen Z Finance Dashboard",
    description: "Track spends, crush savings goals, and plan your retirement early.",
    type: "website",
    images: [{ url: "/superfinz.png", width: 2000, height: 2000, alt: "SuperFinz" }],
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} ${gatwick.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SuperFinz" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen relative">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PicPro AI - Professional Headshots in Minutes",
  description: "Transform your selfies into stunning professional headshots with AI. No photographer needed. Get 100+ headshots for just $29.",
  keywords: ["AI headshots", "professional photos", "LinkedIn photos", "headshot generator", "AI portrait"],
  metadataBase: new URL("https://getpicpro.com"),
  openGraph: {
    title: "PicPro AI - Professional Headshots in Minutes",
    description: "Transform your selfies into stunning professional headshots with AI. No photographer needed.",
    type: "website",
    siteName: "PicPro AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PicPro AI - Professional Headshots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PicPro AI - Professional Headshots in Minutes",
    description: "Transform your selfies into stunning professional headshots with AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#1a1918",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}

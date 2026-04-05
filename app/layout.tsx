import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Wealth Manager",
  description: "Manage your wealth",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wealth Manager",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <QueryProvider>
          <div style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}>{children}</div>
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}

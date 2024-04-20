import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {NavigationBar} from "./NavigationBar";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Wealth Manager",
  icons: {
    icon: "/icon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <>
          <div className="min-h-screen">
          {children}
          </div>
          <NavigationBar />
        </>
      </body>
    </html>
  );
}

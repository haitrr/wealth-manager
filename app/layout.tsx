import type {Metadata} from "next";
import {Inter as FontSans} from "next/font/google";
import "@/styles/globals.css";
import {NavigationBar} from "./NavigationBar";
import {cn} from "@/lib/utils";
import {ThemeProvider} from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Wealth Manager",
  icons: {
    icon: "/icon.jpeg",
  },
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn("min-h-screen font-sans antialiased", fontSans.variable)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen ">{children}</div>
          <NavigationBar />
        </ThemeProvider>
      </body>
    </html>
  );
}

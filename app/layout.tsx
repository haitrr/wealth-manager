import type {Metadata, Viewport} from "next";
import {Inter as FontSans} from "next/font/google";
import "@/styles/globals.css";
import {NavigationBar} from "./NavigationBar";
import {cn} from "@/lib/utils";
import {ThemeProvider} from "@/components/theme-provider";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AntdConfigProvider from "@/components/ui/AntdConfigProvider";

export const metadata: Metadata = {
    title: "Wealth Manager",
    icons: {
        icon: "/icon.jpeg",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    height: "device-height",
    initialScale: 1,
    viewportFit: "cover",
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
        <body className={cn("font-sans antialiased", fontSans.variable)}>
        <AntdRegistry>
            <AntdConfigProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div className="min-h-dvh box-border">{children}</div>
                    <NavigationBar/>
                </ThemeProvider>
            </AntdConfigProvider>
        </AntdRegistry>
        </body>
        </html>
    );
}

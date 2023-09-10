"use client";
import { AuthProvider } from "@/states/auth";
import "./globals.css";
import {Inter} from "next/font/google";
import React from "react";
import {QueryClient, QueryClientProvider} from "react-query";

const inter = Inter({subsets: ["latin"]});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

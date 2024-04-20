import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wealth Manager",
  icons: {
    icon: "/icon.jpeg"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <NavigationBar/>
    </html>
  );
}

function NavigationBar() {
  return (
    <nav className="flex sticky bottom-0 justify-between p-2 bg-gray-900 text-white">
      <div>Home</div>
      <div>Add</div>
      <div>Budget</div>
      <div>Settings</div>
    </nav>
  );
}

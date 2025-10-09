import type { Metadata } from "next";
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
  title: "Okolea — Empowering Kenyans to help each other.",
  description: "Kenyan crowdfunding platform for campaigns and donations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-semibold">Okolea</a>
            <nav className="text-sm text-gray-600">
              <a href="/campaigns/new" className="hover:underline">Start a campaign</a>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">{children}</main>
        <footer className="border-t">
          <div className="container mx-auto px-4 py-6 text-sm text-gray-600">© {new Date().getFullYear()} Okolea</div>
        </footer>
      </body>
    </html>
  );
}

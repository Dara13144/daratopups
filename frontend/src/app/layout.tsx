import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";
import { ThemeProvider } from "../lib/ThemeContext";
import SecurityGuard from "../components/SecurityGuard";
import TelegramSupport from "../components/TelegramSupport";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NADYTOPUP.SITE - Official Game Recharge in Cambodia | Diamonds & Vouchers",
  description: "NADYTOPUP.SITE: Fastest automated game diamond top-ups and gift vouchers in Cambodia. Supports ABA PayWay and ABA KHQR instant payment.",
  icons: {
    icon: [
      { url: '/images/nady-logo.png' },
      { url: '/images/nady-avatar.png' },
    ],
    shortcut: '/images/nady-logo.png',
    apple: '/images/nady-logo.png',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden max-w-full">
        <ThemeProvider>
          <SecurityGuard />
          <LanguageProvider>
            <div className="flex-1 flex flex-col min-h-screen">
              {children}
            </div>
            <TelegramSupport />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

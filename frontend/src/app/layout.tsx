import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋 - Game Recharge in Cambodia | Diamonds & Vouchers",
  description: "𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋: Fastest game diamond top-ups and gift vouchers in Cambodia. Supports ABA PayWay and Bakong KHQR auto-payment.",
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
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

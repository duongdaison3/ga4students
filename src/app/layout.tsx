import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

const inter = Inter({
  subsets: ["vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gemini Academy for Students",
  description: "Dự án cá nhân do GSA Trainer Dương Đại Sơn tổ chức",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <head />
      <body className="min-h-screen flex flex-col bg-white text-slate-800">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

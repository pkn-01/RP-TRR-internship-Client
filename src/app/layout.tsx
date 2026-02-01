import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TRR IT Support | ระบบแจ้งซ่อมออนไลน์",
  description:
    "ระบบแจ้งซ่อมอุปกรณ์ IT สำหรับพนักงาน TRR - รวดเร็ว สะดวก ติดตามสถานะได้ตลอดเวลา",
  keywords: "IT Support, ระบบแจ้งซ่อม, TRR, Help Desk",
  authors: [{ name: "TRR Internship Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head />
      <body className={`${sarabun.variable} antialiased`}>{children}</body>
    </html>
  );
}

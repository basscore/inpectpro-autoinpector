import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "InpectPro — Inspeksi Otomotif Profesional",
    template: "%s | InpectPro",
  },
  description:
    "Web app inspeksi otomotif untuk inspektor. Catat, dokumentasikan, dan susun laporan inspeksi langsung di lapangan.",
  keywords: ["inspeksi", "otomotif", "mobil", "inspektor", "laporan"],
  authors: [{ name: "InpectPro" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InpectPro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1E293B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

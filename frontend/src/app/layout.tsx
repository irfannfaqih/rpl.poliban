import { ImpersonateBanner } from "@/components/ImpersonateBanner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "Sistem RPL POLIBAN - Rekognisi Pembelajaran Lampau",
  description:
    "Portal resmi pendaftaran dan asesmen Rekognisi Pembelajaran Lampau (RPL) Politeknik Negeri Banjarmasin. Daftarkan pengalaman kerja Anda untuk diakui sebagai kredit akademik.",
  keywords: [
    "RPL",
    "POLIBAN",
    "Rekognisi Pembelajaran Lampau",
    "Politeknik Negeri Banjarmasin",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`h-full antialiased`}>
      <body className={`${geistSans.className} min-h-full flex flex-col`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Banner kuning saat Super Admin sedang impersonate */}
            <ImpersonateBanner />
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

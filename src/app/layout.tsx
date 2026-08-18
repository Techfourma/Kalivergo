import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import Image from "next/image";
import { AssistantWidget } from "@/components/ai-assistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Techfourma - Class Management System",
  description: "Platform manajemen kelas Techfourma untuk tracking tugas, keuangan, dan kegiatan kelas",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.jpg", 
  },
  openGraph: {
    title: "Techfourma - Class Management System",
    description: "Platform manajemen kelas Techfourma untuk tracking tugas, keuangan, dan kegiatan kelas",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Techfourma Logo",
      },
    ],
  },
  other: {
    'google-site-verification': 'LBWjCyn1qERTzpox2QxknNvONJCw8YZyET0bBTp_sLE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="shortcut icon" href="/logo.jpg" type="image/jpeg" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col bg-dark-50 text-dark-900">
          {children}
          <AssistantWidget />
        </div>
      </body>
    </html>
  );
}
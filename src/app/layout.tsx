import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/global.css";
import Image from "next/image";
import { AssistantWidget } from "@/features/ai-assistant";
import ThemeProvider from "@/components/ThemeProvider";

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
  title: "Kalivergo - Class Management System",
  description: "Platform manajemen kelas Kalivergo untuk tracking tugas, keuangan, dan kegiatan kelas",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.jpg", 
  },
  openGraph: {
    title: "Kalivergo - Class Management System",
    description: "Platform manajemen kelas Kalivergo untuk tracking tugas, keuangan, dan kegiatan kelas",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Kalivergo Logo",
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="shortcut icon" href="/logo.jpg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kalivergo-theme');document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-dark-50 dark:bg-dark-950 text-dark-900 dark:text-dark-100">
            {children}
            <AssistantWidget />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

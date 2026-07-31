import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INSSUP · Control Operacional de Telecomunicaciones",
  description:
    "Plataforma ejecutiva y operacional de INSSUP para gestionar instalaciones, supervisión, mantenimiento y emergencias 24/7 de sitios de telecomunicaciones en Chile.",
  manifest: "/manifest.webmanifest",
  applicationName: "INSSUP",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "INSSUP",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2933",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('inssup:theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
        <AuthProvider>
          <AuthGate>
            <StoreProvider>
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </AuthGate>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ className: "text-sm" }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
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
  metadataBase: new URL("https://inssupp.vercel.app"),
  title: "INSSUP · Control Operacional de Telecomunicaciones",
  description:
    "Plataforma ejecutiva y operacional de INSSUP para gestionar instalaciones, supervisión, mantenimiento y emergencias 24/7 de sitios de telecomunicaciones en Chile.",
  manifest: "/manifest.webmanifest",
  applicationName: "INSSUP",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "INSSUP",
    startupImage: ["/icons/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "INSSUP · Control Operacional",
    description: "Plataforma operacional de telecomunicaciones en Chile.",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('inssup:theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}" +
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});",
          }}
        />
        <AuthProvider>
          <AuthGate>
            <StoreProvider>
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </AuthGate>
          <InstallPrompt />
          <ServiceWorkerRegister />
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

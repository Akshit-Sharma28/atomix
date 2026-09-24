import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";

import AuthProvider
from "../components/providers/session-provider";
import GlobalPendingLoader from "@/components/ui/global-pending-loader";

const themeInitializationScript = `
  try {
    const theme = localStorage.getItem("atomix:theme") === "light" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
`;

export const metadata: Metadata = {
  title: "ATOMIX",
  description:
    "AI Powered Pentest Platform",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/atomix-mark.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/atomix-mark.svg",
    apple: "/atomix-mark.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <Script
          id="atomix-theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body
        className="
        bg-slate-950
        text-slate-100
        "
      >
        <AuthProvider>
          <Suspense fallback={null}>
            <GlobalPendingLoader />
          </Suspense>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

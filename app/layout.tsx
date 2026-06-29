import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import AuthProvider
from "../components/providers/session-provider";
import GlobalPendingLoader from "@/components/ui/global-pending-loader";

export const metadata: Metadata = {
  title: "ATOMIX",
  description:
    "AI Powered Pentest Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
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

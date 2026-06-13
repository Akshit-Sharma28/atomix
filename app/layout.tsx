import type { Metadata } from "next";
import "./globals.css";

import AuthProvider
from "../components/providers/session-provider";

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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

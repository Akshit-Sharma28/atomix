import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "../components/layout/sidebar";

import {
  getCurrentUser,
} from "../services/users/current-user.service";

export const metadata: Metadata = {
  title: "ATOMIX",
  description:
    "AI Powered Pentest Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user =
    await getCurrentUser();

  return (
    <html lang="en">
      <body
        className="
        bg-slate-950
        text-slate-100
        "
      >
        <div className="flex min-h-screen">

          <Sidebar
            role={
              user?.role ??
              "VIEWER"
            }
          />

          <main className="flex-1">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
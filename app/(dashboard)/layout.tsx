import Sidebar from "@/components/layout/sidebar";

import { getCurrentUser } from "@/services/users/current-user.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
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
);
}

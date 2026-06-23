import Sidebar from "@/components/layout/sidebar";
import FloatingAgentChat from "@/components/agents/floating-agent-chat";
import UserMenu from "@/components/users/user-menu";

import { getCurrentUser } from "@/services/users/current-user.service";

export const dynamic =
  "force-dynamic";

export const preferredRegion =
  "sin1";

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
        "REVIEWER"
      }
    />

    <main className="relative flex-1">
      <div className="fixed right-6 top-6 z-40">
        <UserMenu />
      </div>
      {children}
    </main>
    <FloatingAgentChat />
  </div>
);
}

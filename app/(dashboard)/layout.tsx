import Sidebar from "@/components/layout/sidebar";
import FloatingAgentChat from "@/components/agents/floating-agent-chat";

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

    <main className="flex-1">
      {children}
    </main>
    <FloatingAgentChat />
  </div>
);
}

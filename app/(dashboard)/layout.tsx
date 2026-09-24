import Sidebar from "@/components/layout/sidebar";
import FloatingAgentChat from "@/components/agents/floating-agent-chat";
import UserMenu from "@/components/users/user-menu";
import AtomixPet from "@/components/pet/atomix-pet";

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
    <div className="flex min-h-screen min-w-0">
      <Sidebar
        role={
          user?.role ??
          "REVIEWER"
        }
      />

      <main className="relative min-w-0 flex-1">
        <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
          <UserMenu initialUser={user} />
        </div>
        {children}
      </main>
      <AtomixPet />
      <FloatingAgentChat />
    </div>
  );
}

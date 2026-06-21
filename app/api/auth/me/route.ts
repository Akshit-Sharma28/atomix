import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth/auth";
import { getCurrentUser } from "@/services/users/current-user.service";
import { normalizeRole } from "@/services/users/access.service";

export async function GET() {
  const session =
    await getServerSession(
      authOptions
    );

  const activeUser =
    await getCurrentUser();

  return Response.json({
    session,
    user: activeUser
      ? {
          ...activeUser,
          role: normalizeRole(activeUser.role),
        }
      : session?.user ?? null,
  });
}

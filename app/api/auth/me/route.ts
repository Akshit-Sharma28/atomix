import { getCurrentUser } from "@/services/users/current-user.service";
import { normalizeRole } from "@/services/users/access.service";

export const preferredRegion = "sin1";

export async function GET() {
  const activeUser =
    await getCurrentUser();

  const normalizedUser = activeUser
    ? {
        ...activeUser,
        role: normalizeRole(activeUser.role),
      }
    : null;

  return Response.json({
    session: normalizedUser ? { user: normalizedUser } : null,
    user: normalizedUser,
  });
}

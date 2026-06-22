import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getCurrentUser } from "./current-user.service";

export function normalizeRole(role?: string | null) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  if (role === "DEVELOPER" || role === "VIEWER" || role === "CONSULTANT") {
    return "REVIEWER";
  }

  return role ?? "REVIEWER";
}

export async function getActiveRole() {
  const appUser = await getCurrentUser();

  if (appUser?.role) {
    return normalizeRole(appUser.role);
  }

  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;

  return normalizeRole(sessionRole);
}

export async function canAccess(allowedRoles: string[]) {
  const role = await getActiveRole();

  return allowedRoles.includes(role);
}

export async function requireAccess(allowedRoles: string[]) {
  const role = await getActiveRole();

  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized");
  }

  return role;
}

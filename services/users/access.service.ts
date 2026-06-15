import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getCurrentUser } from "./current-user.service";

export function normalizeRole(role?: string | null) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  if (role === "DEVELOPER") {
    return "REVIEWER";
  }

  if (role === "VIEWER") {
    return "CONSULTANT";
  }

  return role ?? "CONSULTANT";
}

export async function getActiveRole() {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;

  if (sessionRole) {
    return normalizeRole(sessionRole);
  }

  const appUser = await getCurrentUser();

  return normalizeRole(appUser?.role);
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

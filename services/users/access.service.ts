import { getCurrentUser } from "./current-user.service";

export function normalizeRole(role?: string | null) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  if (role === "DEVELOPER" || role === "VIEWER") {
    return "REVIEWER";
  }

  return role ?? "REVIEWER";
}

export async function getActiveRole() {
  const appUser = await getCurrentUser();

  if (appUser?.role) {
    return normalizeRole(appUser.role);
  }

  return normalizeRole(null);
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

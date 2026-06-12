export const permissions = {
  ADMIN: [
    "manage_users",
    "manage_projects",
    "manage_findings",
    "assign_findings",
    "close_findings",
  ],

  SECURITY_LEAD: [
    "assign_findings",
    "review_findings",
    "close_findings",
    "generate_reports",
  ],

  CONSULTANT: [
    "create_findings",
    "edit_findings",
    "generate_ai_analysis",
  ],

  DEVELOPER: [
    "update_status",
  ],

  VIEWER: [],
} as const;

export function hasPermission(
  role: keyof typeof permissions,
  permission: string
) {
  return permissions[role].includes(
    permission as never
  );
}
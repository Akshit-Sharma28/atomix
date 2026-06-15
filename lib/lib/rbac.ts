export const permissions = {
  ADMIN: [
    "manage_users",
    "manage_projects",
    "manage_findings",
    "assign_findings",
    "close_findings",
    "manage_governance",
    "manage_reviewer_pool",
  ],

  GOVERNANCE_TEAM: [
    "assign_findings",
    "review_findings",
    "close_findings",
    "generate_reports",
    "manage_governance",
    "manage_reviewer_pool",
  ],

  QA_REVIEWER: [
    "review_findings",
    "peer_review",
    "generate_reports",
  ],

  REVIEWER: [
    "review_findings",
    "create_findings",
    "edit_findings",
  ],

  EXECUTIVE: [
    "view_executive_dashboard",
    "generate_reports",
  ],

  ENGAGEMENT_MANAGER: [
    "manage_projects",
    "assign_findings",
    "generate_reports",
    "manage_governance",
  ],

  CONSULTANT: [
    "create_findings",
    "edit_findings",
    "generate_ai_analysis",
    "update_sla_work",
  ],

  SECURITY_LEAD: [
    "assign_findings",
    "review_findings",
    "close_findings",
    "generate_reports",
    "manage_governance",
    "manage_reviewer_pool",
  ],

  DEVELOPER: [
    "review_findings",
    "create_findings",
    "edit_findings",
  ],

  VIEWER: [
    "update_sla_work",
  ],
} as const;

export function hasPermission(
  role: keyof typeof permissions,
  permission: string
) {
  return permissions[role].includes(
    permission as never
  );
}

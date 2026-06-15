import { prisma } from "@/lib/prisma";

function weight(severity: string) {
  if (severity === "Critical") return 10;
  if (severity === "High") return 7;
  if (severity === "Medium") return 4;
  if (severity === "Low") return 1;
  return 0;
}

export async function GET() {
  const [projects, findings, reviews] = await Promise.all([
    prisma.project.findMany({
      include: {
        findings: true,
        reviews: {
          include: {
            assignments: true,
            extensions: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.finding.findMany({
      include: {
        project: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.securityReview.findMany({
      include: {
        project: true,
        assignments: true,
        extensions: true,
      },
    }),
  ]);

  const openFindings = findings.filter(
    (finding) => finding.status !== "Closed",
  );
  const critical = openFindings.filter(
    (finding) => finding.severity === "Critical",
  );
  const high = openFindings.filter(
    (finding) => finding.severity === "High",
  );
  const activeReviews = reviews.filter(
    (review) => !["Completed", "Cancelled"].includes(review.status),
  );
  const unassignedReviews = activeReviews.filter(
    (review) => review.assignments.length === 0,
  );
  const extensionRequests = reviews.flatMap((review) =>
    review.extensions.filter(
      (extension) => extension.status === "Requested",
    ),
  );
  const topProjects = projects
    .map((project) => ({
      name: project.name,
      sprId: project.sprId ?? "SPR pending",
      score: project.findings.reduce(
        (total, finding) => total + weight(finding.severity),
        0,
      ),
      open: project.findings.filter(
        (finding) => finding.status !== "Closed",
      ).length,
      reviews: project.reviews.filter(
        (review) => !["Completed", "Cancelled"].includes(review.status),
      ).length,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  const report = `# Atomix Executive Security Report

Generated: ${new Date().toLocaleString()}

## Executive Summary
- ${projects.length} projects / SPRs are tracked in Atomix.
- ${activeReviews.length} active SRs are in delivery.
- ${critical.length} critical and ${high.length} high findings remain open.
- ${unassignedReviews.length} SRs need reviewer assignment.
- ${extensionRequests.length} extension requests require governance review.

## Leadership Priorities
1. Resolve critical findings with business owners and target dates.
2. Assign reviewers to unstaffed SRs before intake grows.
3. Review extension requests and overdue SRs in governance standup.
4. Use Pentester Tracker to rebalance capacity and peer-review load.

## Top Risk Projects
${topProjects
  .map(
    (project, index) =>
      `${index + 1}. ${project.name} (${project.sprId}) — risk score ${project.score}, ${project.open} open findings, ${project.reviews} active SRs.`,
  )
  .join("\n")}

## Recent Critical Findings
${critical
  .slice(0, 8)
  .map(
    (finding) =>
      `- ${finding.title} — ${finding.project.sprId ?? finding.project.name} / ${finding.review?.srId ?? "No SR"}`,
  )
  .join("\n") || "- No open critical findings."}

## Agentic Follow-up
- Ask Executive Agent for a board-ready narrative.
- Ask Governance Agent to create this week's capacity rebalance plan.
- Ask Peer Review Agent to identify QA blockers.
`;

  return Response.json({
    report,
    summary: {
      projects: projects.length,
      activeReviews: activeReviews.length,
      critical: critical.length,
      high: high.length,
      unassignedReviews: unassignedReviews.length,
      extensionRequests: extensionRequests.length,
    },
  });
}

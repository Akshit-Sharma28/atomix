import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const project =
    await prisma.project.findUnique({
      where: {
        id: body.projectId,
      },
      include: {
        findings: true,
      },
    });

  if (!project) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const critical =
    project.findings.filter(
      (f) =>
        f.severity === "Critical"
    ).length;

  const high =
    project.findings.filter(
      (f) =>
        f.severity === "High"
    ).length;

  const summary = `
Project contains ${project.findings.length} findings.

Critical Findings: ${critical}

High Findings: ${high}

Overall Risk:
${
  critical > 0
    ? "HIGH"
    : high > 5
    ? "MEDIUM"
    : "LOW"
}
`;

  return NextResponse.json({
    summary,
  });
}
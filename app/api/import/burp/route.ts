import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { parseBurpXml } from "../../../../parsers/burp/parser";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("file") as File;
  const projectId =
    formData.get("projectId");

  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  if (
    typeof projectId !== "string" ||
    projectId.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Project is required" },
      { status: 400 }
    );
  }

  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const xml = await file.text();

  const issues = await parseBurpXml(xml);

  let imported = 0;

  for (const issue of issues) {
    await prisma.finding.create({
      data: {
        title:
          issue.name || "Unknown Finding",

        severity:
          issue.severity || "Info",

        source:
          "Burp Suite",

        description:
          issue.issueBackground ||
          "No description",

        remediation:
          issue.remediationBackground ||
          "No remediation",

        status: "Open",

        projectId,
      },
    });

    imported++;
  }

  return NextResponse.json({
    success: true,
    imported,
  });
}

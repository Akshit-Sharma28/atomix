import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { parseBurpXml } from "../../../../parsers/burp/parser";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
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

        projectId:
          "REPLACE_WITH_PROJECT_ID",
      },
    });

    imported++;
  }

  return NextResponse.json({
    success: true,
    imported,
  });
}
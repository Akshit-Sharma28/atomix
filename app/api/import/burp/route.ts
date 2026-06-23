import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { parseBurpXml } from "../../../../parsers/burp/parser";
import { getCurrentUser } from "@/services/users/current-user.service";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("file") as File;
  const projectId =
    formData.get("projectId");
  const reviewId =
    formData.get("reviewId");
  const iteration =
    String(formData.get("iteration") ?? "1.0");
  const visibility =
    String(formData.get("visibility") ?? "REVIEW_TEAM");

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
      include: {
        reviews:
          typeof reviewId === "string" &&
          reviewId.trim().length > 0
            ? {
                where: {
                  id: reviewId,
                },
                take: 1,
              }
            : false,
      },
    });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const xml = await file.text();
  const currentUser =
    await getCurrentUser();
  const review =
    "reviews" in project
      ? project.reviews[0]
      : null;

  await prisma.knowledgeDocument.create({
    data: {
      title: `Burp Suite XML · ${file.name}`,
      source: `Burp Suite · ${project.sprId ?? project.name}${review?.srId ? ` · ${review.srId}` : ""} · Iteration ${iteration}`,
      documentType: "Scan Report",
      content: xml.slice(0, 30000),
      projectId:
        typeof projectId === "string"
          ? projectId
          : undefined,
      reviewId: review?.id,
      sprId: project.sprId,
      srId: review?.srId,
      iteration,
      artifactType: "Scan Report",
      scanner: "Burp Suite",
      fileName: file.name,
      uploadedById: currentUser?.id,
      visibility,
    },
  });

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
        reviewId: review?.id,
      },
    });

    imported++;
  }

  return NextResponse.json({
    success: true,
    imported,
  });
}

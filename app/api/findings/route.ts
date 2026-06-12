import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const findings = await prisma.finding.findMany({
    include: {
      project: true,
    },
  });

  return NextResponse.json(findings);
}

export async function POST(req: Request) {
  const body = await req.json();

  const finding = await prisma.finding.create({
    data: {
      title: body.title,
      severity: body.severity,
      source: body.source,
      description: body.description,
      remediation: body.remediation,
      projectId: body.projectId,
    },
  });

  return NextResponse.json(finding);
}
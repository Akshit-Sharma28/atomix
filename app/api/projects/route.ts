import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

function normalizeOptional(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest) {
  await requireAccess(["ADMIN"]);

  const body = await req.json();

  if (
    typeof body.name !== "string" ||
    body.name.trim().length === 0
  ) {
    return NextResponse.json(
      {
        error: "Information System name is required",
      },
      {
        status: 400,
      }
    );
  }

  const projectCount =
    await prisma.project.count();

  const sprId =
    normalizeOptional(body.sprId) ??
    `SPR-${String(projectCount + 1).padStart(4, "0")}`;

  const project =
    await prisma.project.create({
      data: {
        name: body.name.trim(),
        client:
          normalizeOptional(body.client),
        sprId,
        status:
          normalizeOptional(body.status) ??
          "Active",
        riskTier:
          normalizeOptional(body.riskTier),
        businessOwner:
          normalizeOptional(
            body.businessOwner
          ),
        technicalOwner:
          normalizeOptional(
            body.technicalOwner
          ),
      },
    });

  return NextResponse.json(project, {
    status: 201,
  });
}

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

type CommandBody = {
  command:
    | "create_user"
    | "create_project"
    | "create_sr"
    | "create_finding";
  data: Record<string, any>;
};

function required(data: Record<string, any>, key: string) {
  const value = data[key];

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return String(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CommandBody;
    const data = body.data ?? {};

    await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);

    if (body.command === "create_user") {
      await requireAccess(["ADMIN"]);
      const password = data.password ? String(data.password) : "";
      const user = await prisma.user.create({
        data: {
          name: required(data, "name"),
          email: required(data, "email").toLowerCase(),
          role: (data.role ?? "REVIEWER") as any,
          isActive: true,
        },
      });

      if (password) {
        await prisma.account.create({
          data: {
            userId: user.id,
            passwordHash: await bcrypt.hash(password, 10),
          },
        });
      }

      return Response.json({
        ok: true,
        created: "user",
        user,
      });
    }

    if (body.command === "create_project") {
      const project = await prisma.project.create({
        data: {
          name: required(data, "name"),
          client: data.client ? String(data.client) : undefined,
          sprId: data.sprId ? String(data.sprId) : undefined,
          riskTier: data.riskTier ? String(data.riskTier) : undefined,
          businessOwner: data.businessOwner
            ? String(data.businessOwner)
            : undefined,
          technicalOwner: data.technicalOwner
            ? String(data.technicalOwner)
            : undefined,
        },
      });

      return Response.json({
        ok: true,
        created: "project",
        project,
      });
    }

    if (body.command === "create_sr") {
      const projectId = required(data, "projectId");
      const count = await prisma.securityReview.count({
        where: {
          projectId,
        },
      });
      const review = await prisma.securityReview.create({
        data: {
          projectId,
          title: required(data, "title"),
          type: data.type ? String(data.type) : "PENTEST",
          priority: data.priority ? String(data.priority) : "Medium",
          status: data.status ? String(data.status) : "Requested",
          srId:
            data.srId ??
            `SR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
          dueDate: data.dueDate ? new Date(String(data.dueDate)) : undefined,
        },
      });

      return Response.json({
        ok: true,
        created: "security_review",
        review,
      });
    }

    if (body.command === "create_finding") {
      const finding = await prisma.finding.create({
        data: {
          projectId: required(data, "projectId"),
          reviewId: data.reviewId ? String(data.reviewId) : undefined,
          title: required(data, "title"),
          severity: data.severity ? String(data.severity) : "Medium",
          source: data.source ? String(data.source) : "Atomix Agent",
          status: data.status ? String(data.status) : "Open",
          description: data.description
            ? String(data.description)
            : undefined,
          remediation: data.remediation
            ? String(data.remediation)
            : undefined,
        },
      });

      return Response.json({
        ok: true,
        created: "finding",
        finding,
      });
    }

    return Response.json(
      {
        error: "Unsupported command",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Command failed",
      },
      {
        status: 400,
      },
    );
  }
}

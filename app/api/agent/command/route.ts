import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

type CommandData = Record<string, unknown>;

type CommandBody = {
  command:
    | "create_user"
    | "create_project"
    | "create_sr"
    | "create_finding"
    | "peer_review";
  data: CommandData;
};

function required(data: CommandData, key: string) {
  const value = data[key];

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return String(value);
}

function roleValue(value: unknown) {
  const role = value ? String(value) : "REVIEWER";

  if (!Object.values(Role).includes(role as Role)) {
    throw new Error("role is invalid");
  }

  return role as Role;
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
          role: roleValue(data.role),
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

    if (body.command === "peer_review") {
      const files = (data.files ?? {}) as CommandData;
      const risk = (data.risk ?? {}) as CommandData;
      const scanReports = Array.isArray(files.scanReports)
        ? files.scanReports.map(String).filter(Boolean)
        : [];
      const scope = required(data, "scope");
      const reviewType = required(data, "typeOfReview");

      return Response.json({
        ok: true,
        agent: "peer_review",
        objective:
          "Cross-check FEAD, BEAD, scan reports, and reviewer findings against scope-driven peer review guidelines.",
        scopePackage: {
          scope,
          typeOfReview: reviewType,
          spr: required(data, "spr"),
          sr: required(data, "sr"),
          typeOfApplication: required(data, "typeOfApplication"),
          overallRisk: data.overallRisk
            ? String(data.overallRisk)
            : "Not provided",
          risk: {
            confidentiality: risk.confidentiality ?? "Not provided",
            integrity: risk.integrity ?? "Not provided",
            availability: risk.availability ?? "Not provided",
          },
          attackVector: required(data, "network"),
          authentication: data.authentication
            ? String(data.authentication)
            : "Not provided",
          targetUrl: data.targetUrl
            ? String(data.targetUrl)
            : "Not provided",
          ipAddress: data.ipAddress
            ? String(data.ipAddress)
            : "Not provided",
          roles: data.roles ? String(data.roles) : "Not provided",
          files: {
            feadWordFile: required(files, "feadWordFile"),
            beadWordFile: files.beadWordFile
              ? String(files.beadWordFile)
              : "Not provided",
            llmFeadFile: files.llmFeadFile
              ? String(files.llmFeadFile)
              : "Not provided",
            scanReports,
          },
        },
        checks: [
          "Confirm FEAD controls match the declared scope, review type, application exposure, CIA rating, AV, Au, URL/IP, and RBAC roles.",
          "Use BEAD when backend, API, service, or data-flow controls are applicable to the declared scope.",
          "Validate that applicable Qualys, Checkmarx, Mend, AquaSec, Burp, manual evidence, and LLM FEAD outputs are present or explicitly marked not applicable.",
          "Compare scanner findings with FEAD/BEAD findings to detect missing, downgraded, duplicated, or unsupported issues.",
          "Flag controls that need more testing, missing evidence, reviewer follow-up, or peer review escalation.",
        ],
        controlCoverage: [
          "0.1 Security review notification and stakeholder awareness",
          "6.3 Authentication controls",
          "7.1 Authorization controls",
          "8.x Session management, cookie flags, CSRF, concurrent sessions",
          "9.3 XSS",
          "9.4 Command Injection",
          "9.10 SSRF",
          "11.1 Secure token transmission",
          "14.2 Server-side code exposure",
          "14.7 Version disclosure",
          "15.18 Email restrictions",
          "16.14 Security headers including CSP, Cache-Control, and X-CTO",
          "19.1-19.6 JWT security, headers, identity exposure, and API rate limiting",
          "21.1 Model denial of service",
          "21.2 Data exfiltration",
          "21.3 Data poisoning",
          "21.4 Prompt injection and jailbreak",
          "21.5 Arbitrary plugin invocation",
          "21.6 Sensitive data leakage",
          "21.7 OSS approval",
          "17.13 Responsible AI principles",
          "17.14 Model validation and drift",
          "17.15 Audit trail and explainability",
        ],
        requiredArtifacts: {
          fead: "Required for Web, Web + LLM, LLM only, and Thick Client reviews when frontend controls are in scope.",
          bead: "Required when backend, API, service, data-flow, auth, or integration controls are in scope.",
          llmFead:
            "Required when LLM-integrated behavior, model workflows, prompt flows, tool use, data leakage, or AI controls are in scope.",
          scans:
            "Attach applicable Qualys, Checkmarx, Mend, AquaSec, Burp, and manual evidence reports; explain any scanner that is not applicable.",
        },
        outputFormat: [
          "Coverage gaps",
          "Potential missed findings",
          "Controls needing more testing",
          "Scanner-to-artifact mismatches",
          "Peer review decision and required reviewer actions",
        ],
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
            data.srId ?
              String(data.srId)
            : `SR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
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

import { prisma } from "../../../lib/prisma";
import { analyzeFinding } from "../../../services/ai/openai.service";

export async function POST(req: Request) {
  const body = await req.json();

  const finding =
    await prisma.finding.findUnique({
      where: {
        id: body.findingId,
      },
    });

  if (!finding) {
    return Response.json(
      {
        error: "Finding not found",
      },
      {
        status: 404,
      }
    );
  }

  const analysis =
    await analyzeFinding(
      finding.title,
      finding.description || ""
    );

  const result =
    await prisma.findingAnalysis.upsert({
      where: {
        findingId: finding.id,
      },

      update: {
        riskScore:
          analysis.riskScore,

        businessImpact:
          analysis.businessImpact,

        technicalImpact:
          analysis.technicalImpact,

        remediationPlan:
          analysis.remediationPlan,

        developerGuidance:
          analysis.developerGuidance,

        executiveSummary:
          analysis.executiveSummary,
      },

      create: {
        findingId: finding.id,

        riskScore:
          analysis.riskScore,

        businessImpact:
          analysis.businessImpact,

        technicalImpact:
          analysis.technicalImpact,

        remediationPlan:
          analysis.remediationPlan,

        developerGuidance:
          analysis.developerGuidance,

        executiveSummary:
          analysis.executiveSummary,
      },
    });

  return Response.json(result);
}
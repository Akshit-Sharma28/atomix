import { prisma } from "@/lib/prisma";
import { askCopilot } from "@/services/ai/openai.service";
import { extractPdfText } from "@/services/knowledge/pdf.service";
import { getCurrentUser } from "@/services/users/current-user.service";
import mammoth from "mammoth";

async function fileToText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (
    file.type.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return `[Image evidence uploaded: ${file.name}. Image OCR is not enabled in this upload path yet. Use reviewer comments or the Peer Review Agent for visual evidence interpretation.]`;
  }

  if (
    file.type.includes("pdf") ||
    name.endsWith(".pdf")
  ) {
    return extractPdfText(buffer);
  }

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    const result = await mammoth.extractRawText({
      buffer,
    });

    return result.value;
  }

  return buffer.toString("utf8");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectId = String(form.get("projectId") ?? "");
  const reviewId = String(form.get("reviewId") ?? "");
  const scanner = String(form.get("scanner") ?? "Generic");
  const artifactType = String(form.get("artifactType") ?? "Scan Report");
  const iteration = String(form.get("iteration") ?? "1.0");
  const visibility = String(form.get("visibility") ?? "REVIEW_TEAM");
  const currentUser = await getCurrentUser();

  if (!file || !projectId) {
    return Response.json(
      {
        error: "File and project are required",
      },
      {
        status: 400,
      },
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      reviews: {
        where: reviewId
          ? {
              id: reviewId,
            }
          : undefined,
        take: 1,
      },
    },
  });

  if (!project) {
    return Response.json(
      {
        error: "Project not found",
      },
      {
        status: 404,
      },
    );
  }

  const text = (await fileToText(file)).slice(0, 30000);
  const review = project.reviews[0];
  const document = await prisma.knowledgeDocument.create({
    data: {
      title: `${artifactType} · ${file.name}`,
      source: `${scanner} · ${project.sprId ?? project.name}${review?.srId ? ` · ${review.srId}` : ""} · Iteration ${iteration}`,
      documentType: artifactType,
      content: text,
      projectId,
      reviewId: review?.id,
      sprId: project.sprId,
      srId: review?.srId,
      iteration,
      artifactType,
      scanner,
      fileName: file.name,
      uploadedById: currentUser?.id,
      visibility,
    },
  });

  const prompt = `
Analyze this ${artifactType} from ${scanner} for project ${project.name} (${project.sprId ?? "SPR pending"}${review?.srId ? ` / ${review.srId}` : ""}), review iteration ${iteration}.

Act as a document reviewer and RAG security agent. Extract:
1. Executive summary
2. Top risks
3. Findings likely requiring SPR/SR mapping
4. False-positive or validation notes
5. Recommended reviewer/team assignment
6. Follow-up commands that could create findings/SRs in Atomix

Report excerpt:
${text.slice(0, 12000)}
`;

  const analysis = await askCopilot(
    prompt,
    `Project: ${project.name}\nSPR: ${project.sprId ?? "SPR pending"}`,
  );

  return Response.json({
    document,
    analysis,
  });
}

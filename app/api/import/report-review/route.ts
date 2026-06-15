import { prisma } from "@/lib/prisma";
import { askCopilot } from "@/services/ai/openai.service";
import { extractPdfText } from "@/services/knowledge/pdf.service";

async function fileToText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (
    file.type.includes("pdf") ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return extractPdfText(buffer);
  }

  return buffer.toString("utf8");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectId = String(form.get("projectId") ?? "");
  const scanner = String(form.get("scanner") ?? "Generic");

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
  const document = await prisma.knowledgeDocument.create({
    data: {
      title: file.name,
      source: `${scanner} report · ${project.sprId ?? project.name}`,
      documentType: "AI Scanner Report",
      content: text,
    },
  });

  const prompt = `
Analyze this ${scanner} security report for project ${project.name} (${project.sprId ?? "SPR pending"}).

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

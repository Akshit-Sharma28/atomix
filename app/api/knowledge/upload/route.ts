import { prisma } from "../../../../lib/prisma";
import { extractPdfText } from "../../../../services/knowledge/pdf.service";

export async function POST(
  req: Request
) {
  const form =
    await req.formData();

  const file =
    form.get("file") as File;

  if (!file) {
    return Response.json(
      { error: "No file" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  const text =
    await extractPdfText(buffer);

  const doc =
    await prisma.knowledgeDocument.create({
      data: {
        title: file.name,
        source: "PDF Upload",
        documentType: "Report",
        content: text,
      },
    });

  return Response.json(doc);
}
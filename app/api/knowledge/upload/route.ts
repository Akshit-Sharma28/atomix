import { prisma } from "../../../../lib/prisma";
import { extractPdfText } from "../../../../services/knowledge/pdf.service";
import mammoth from "mammoth";

async function extractText(
  file: File,
  buffer: Buffer
) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractPdfText(buffer);
  }

  if (
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    const result =
      await mammoth.extractRawText({
        buffer,
      });

    return result.value;
  }

  return buffer.toString("utf8");
}

export async function POST(
  req: Request
) {
  const form =
    await req.formData();

  const file =
    form.get("file") as File;
  const documentType =
    form.get("documentType")?.toString() ??
    "Report";
  const source =
    form.get("source")?.toString() ??
    "Imported Artifact";

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
    await extractText(file, buffer);

  const doc =
    await prisma.knowledgeDocument.create({
      data: {
        title: file.name,
        source,
        documentType,
        content: text,
      },
    });

  return Response.json(doc);
}

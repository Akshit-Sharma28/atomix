import mammoth from "mammoth";
import { extractPdfText } from "@/services/knowledge/pdf.service";

export type ExtractedPeerReviewFile = {
  name: string;
  type: string;
  size: number;
  text: string;
};

function isPdf(file: File) {
  return (
    file.type.includes("pdf") ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function isDocx(file: File) {
  return (
    file.type.includes(
      "officedocument.wordprocessingml.document",
    ) ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

export async function extractPeerReviewFile(
  file: File,
): Promise<ExtractedPeerReviewFile> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isPdf(file)) {
    return {
      name: file.name,
      type: "PDF",
      size: file.size,
      text: await extractPdfText(buffer),
    };
  }

  if (isDocx(file)) {
    const result = await mammoth.extractRawText({
      buffer,
    });

    return {
      name: file.name,
      type: "Word",
      size: file.size,
      text: result.value,
    };
  }

  return {
    name: file.name,
    type: file.type || "Text",
    size: file.size,
    text: buffer.toString("utf8"),
  };
}

export function summarizeExtractedFiles(
  files: ExtractedPeerReviewFile[],
) {
  return files.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
    characters: file.text.length,
  }));
}

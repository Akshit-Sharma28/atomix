import { prisma } from "../../lib/prisma";

export async function searchKnowledge(
  query: string
) {
  const docs =
    await prisma.knowledgeDocument.findMany();

  return docs.filter((doc) =>
    doc.content
      .toLowerCase()
      .includes(
        query.toLowerCase()
      )
  );
}
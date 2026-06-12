import { prisma } from "../../../lib/prisma";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const doc =
    await prisma.knowledgeDocument.create({
      data: {
        title: body.title,
        source: body.source,
        content: body.content,
        documentType:
          body.documentType,
      },
    });

  return Response.json(doc);
}

export async function GET() {
  const docs =
    await prisma.knowledgeDocument.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  return Response.json(docs);
}
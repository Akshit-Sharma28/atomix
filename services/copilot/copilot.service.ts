import { prisma } from "../../lib/prisma";

export async function buildContext(
  question: string
) {
  const findings =
    await prisma.finding.findMany({
      include: {
        project: true,
        owner: true,
      },
      take: 50,
    });

  const docs =
    await prisma.knowledgeDocument.findMany();

  const matchingDocs =
    docs.filter((doc) =>
      doc.content
        .toLowerCase()
        .includes(
          question.toLowerCase()
        )
    );

  const findingContext =
    findings
      .map(
        (f) => `
Finding:
${f.title}

Severity:
${f.severity}

Project:
${f.project.name}

Owner:
${f.owner?.name ?? "Unassigned"}

Status:
${f.status}
`
      )
      .join("\n");

  const knowledgeContext =
    matchingDocs
      .map(
        (d) => `
Document:
${d.title}

${d.content}
`
      )
      .join("\n");

  return `
${findingContext}

${knowledgeContext}
`;
}
import { prisma } from "../../lib/prisma";
import KanbanBoard from "../../components/timeline/kanban-board";

export default async function TimelinePage() {
  const findings =
    await prisma.finding.findMany({
      include: {
        owner: true,
      },
    });

  const kanbanFindings =
    findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      status: finding.status,
      owner:
        finding.owner?.name ?? null,
    }));

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        Remediation Board
      </h1>

      <KanbanBoard
        findings={kanbanFindings}
      />
    </div>
  );
}
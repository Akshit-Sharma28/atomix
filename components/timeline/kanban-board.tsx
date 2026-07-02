import Link from "next/link";

interface Finding {
  id: string;
  title: string;
  severity: string;
  status: string;
  owner?: string | null;
  project?: string | null;
  review?: string | null;
  dueDate?: string | null;
}

export default function KanbanBoard({
  findings,
}: {
  findings: Finding[];
}) {
  const columns = [
    "Open",
    "Assigned",
    "In Progress",
    "Ready For Retest",
    "Closed",
  ];

  const getHeaderColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-red-400";
      case "Assigned":
        return "text-yellow-400";
      case "In Progress":
        return "text-blue-400";
      case "Ready For Retest":
        return "text-purple-400";
      case "Closed":
        return "text-green-400";
      default:
        return "text-white";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            Remediation flow
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            Finding Kanban
          </h2>
        </div>
        <p className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
          {findings.length} tracked findings
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[1040px] grid-cols-5 gap-3">
          {columns.map((column) => {
            const columnFindings = findings.filter(
              (finding) => finding.status === column,
            );

            return (
              <div
                key={column}
                className="flex max-h-[440px] min-h-[300px] flex-col rounded-2xl border border-slate-800 bg-slate-950/70"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur">
                  <h3
                    className={`text-sm font-bold ${getHeaderColor(column)}`}
                  >
                    {column}
                  </h3>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    {columnFindings.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {columnFindings.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                      No findings here.
                    </div>
                  )}

            {findings
              .filter(
                (f) => f.status === column
              )
              .map((finding) => (
                <Link
                  key={finding.id}
                  href={`/findings/${finding.id}`}
                  className="
                  block
                  bg-slate-900/90
                  border
                  border-cyan-500/20
                  rounded-xl
                  p-3
                  cursor-pointer
                  hover:border-cyan-400
                  hover:shadow-lg
                  hover:shadow-cyan-500/10
                  transition-all
                  "
                >
                  <p
                    className="
                    font-semibold
                    text-white
                    mb-2
                    line-clamp-2
                    "
                  >
                    {finding.title}
                  </p>

                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-semibold uppercase ${getSeverityColor(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </p>
                    {finding.dueDate && (
                      <p className="text-xs text-orange-300">
                        {finding.dueDate}
                      </p>
                    )}
                  </div>

                  <p
                    className="
                    text-xs
                    text-slate-400
                    "
                  >
                    {finding.owner ||
                      "Unassigned"}
                  </p>

                  {(finding.project ||
                    finding.review) && (
                    <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                      {finding.project}
                      {finding.review
                        ? ` · ${finding.review}`
                        : ""}
                    </p>
                  )}
                </Link>
              ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

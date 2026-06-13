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
    <div className="grid grid-cols-5 gap-6">
      {columns.map((column) => (
        <div
          key={column}
          className="
          bg-slate-950/60
          border
          border-slate-800
          rounded-2xl
          p-4
          min-h-[500px]
          "
        >
          <h2
            className={`
            font-bold
            mb-4
            text-lg
            ${getHeaderColor(column)}
            `}
          >
            {column}
          </h2>

          <div className="space-y-3">
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
                  bg-slate-900
                  border
                  border-cyan-500/20
                  rounded-xl
                  p-4
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
                    "
                  >
                    {finding.title}
                  </p>

                  <p
                    className={`
                    text-sm
                    mb-1
                    ${getSeverityColor(
                      finding.severity
                    )}
                    `}
                  >
                    {finding.severity}
                  </p>

                  <p
                    className="
                    text-sm
                    text-slate-400
                    "
                  >
                    {finding.owner ||
                      "Unassigned"}
                  </p>

                  {(finding.project ||
                    finding.review) && (
                    <p className="mt-2 text-xs text-slate-500">
                      {finding.project}
                      {finding.review
                        ? ` · ${finding.review}`
                        : ""}
                    </p>
                  )}

                  {finding.dueDate && (
                    <p className="mt-2 text-xs text-orange-300">
                      Due {finding.dueDate}
                    </p>
                  )}
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

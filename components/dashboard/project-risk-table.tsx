import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface ProjectRisk {
  id: string;
  name: string;
  client: string | null;
  riskScore: number;
  openCount: number;
}

export default function ProjectRiskTable({
  projects,
}: {
  projects: ProjectRisk[];
}) {
  function getRiskBadge(score: number) {
    if (score >= 80) {
      return {
        label: "Critical",
        className:
          "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <ShieldAlert size={14} />,
      };
    }

    if (score >= 50) {
      return {
        label: "High",
        className:
          "bg-orange-500/20 text-orange-400 border-orange-500/30",
        icon: <AlertTriangle size={14} />,
      };
    }

    return {
      label: "Low",
      className:
        "bg-green-500/20 text-green-400 border-green-500/30",
      icon: <ShieldCheck size={14} />,
    };
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">

      <table className="w-full">

        <thead>
          <tr className="bg-slate-900 border-b border-slate-800">

            <th className="text-left p-4 text-slate-400">
              Project
            </th>

            <th className="text-left p-4 text-slate-400">
              Client
            </th>

            <th className="text-left p-4 text-slate-400">
              Risk Score
            </th>

            <th className="text-left p-4 text-slate-400">
              Status
            </th>

            <th className="text-left p-4 text-slate-400">
              Open Findings
            </th>

          </tr>
        </thead>

        <tbody>

          {projects.map((project) => {
            const badge =
              getRiskBadge(project.riskScore);

            return (
              <tr
                key={project.id}
                className="
                border-b
                border-slate-800
                hover:bg-slate-900/50
                transition-colors
                "
              >
                <td className="p-4 font-medium text-white">
                  {project.name}
                </td>

                <td className="p-4 text-slate-300">
                  {project.client || "-"}
                </td>

                <td className="p-4">
                  <span
                    className="
                    text-cyan-400
                    font-bold
                    text-lg
                    "
                  >
                    {project.riskScore}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={`
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-1
                    rounded-full
                    border
                    text-sm
                    ${badge.className}
                    `}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className="
                    bg-slate-800
                    px-3
                    py-1
                    rounded-lg
                    text-white
                    "
                  >
                    {project.openCount}
                  </span>
                </td>
              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}
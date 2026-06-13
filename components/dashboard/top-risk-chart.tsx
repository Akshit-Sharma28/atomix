"use client";

interface Props {
  projects: {
    id: string;
    name: string;
    riskScore: number;
  }[];
}

export default function TopRiskChart({
  projects,
}: Props) {
  const data = [...projects]
    .filter((p) => p.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return (
    <div
      className="
      bg-slate-900
      border
      border-red-500/10
      rounded-2xl
      p-5
      h-full
      "
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">
          Top Risk Projects
        </h2>

        <span
          className="
          text-xs
          text-slate-500
          "
        >
          Projects by risk score
        </span>
      </div>

      {data.length > 0 ? (
        <div className="space-y-5">
          {data.map((project) => {
            const barColor =
              project.riskScore >= 8
                ? "bg-red-500"
                : project.riskScore >= 5
                ? "bg-orange-500"
                : project.riskScore >= 3
                ? "bg-yellow-500"
                : "bg-green-500";

            return (
              <div key={project.id}>
                <div className="flex justify-between mb-2">
                  <span
                    className="
                    text-white
                    text-sm
                    font-medium
                    "
                  >
                    {project.name}
                  </span>

                  <span
                    className="
                    text-sm
                    font-medium
                    text-slate-400
                    "
                  >
                    Risk Score {project.riskScore}
                  </span>
                </div>

                <div
                  className="
                  h-3
                  bg-slate-800
                  rounded-full
                  overflow-hidden
                  "
                >
                  <div
                    className={`
                    h-full
                    rounded-full
                    ${barColor}
                    `}
                    style={{
                      width: `${Math.min(
                        project.riskScore * 8,
                        90
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="
          flex
          items-center
          justify-center
          h-[180px]
          text-slate-500
          "
        >
          No project data available
        </div>
      )}

      <div
        className="
        mt-6
        pt-4
        border-t
        border-slate-800
        flex
        gap-4
        text-xs
        "
      >
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>High</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}
import { prisma } from "../../lib/prisma";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      findings: true,
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        Projects
      </h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          const criticalCount =
            project.findings.filter(
              (f) =>
                f.severity === "Critical"
            ).length;

          const openCount =
            project.findings.filter(
              (f) =>
                f.status !== "Closed"
            ).length;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="
              bg-slate-900
              border
              border-cyan-500/20
              rounded-2xl
              p-6
              hover:border-cyan-400
              hover:shadow-lg
              hover:shadow-cyan-500/10
              transition-all
              "
            >
              <h2 className="text-xl font-bold mb-2">
                {project.name}
              </h2>

              <p className="text-slate-400 mb-4">
                {project.client}
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  Total Findings:{" "}
                  {project.findings.length}
                </p>

                <p className="text-red-400">
                  Critical Findings:{" "}
                  {criticalCount}
                </p>

                <p className="text-yellow-400">
                  Open Findings:{" "}
                  {openCount}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
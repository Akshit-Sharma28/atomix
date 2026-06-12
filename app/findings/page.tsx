import { prisma } from "../../lib/prisma";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  Filter,
} from "lucide-react";

export default async function FindingsPage() {
  const findings = await prisma.finding.findMany({
    include: {
      project: true,
      owner: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const severityColors: Record<
    string,
    string
  > = {
    Critical:
      "bg-red-500/20 text-red-400 border border-red-500/20",

    High:
      "bg-orange-500/20 text-orange-400 border border-orange-500/20",

    Medium:
      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",

    Low:
      "bg-green-500/20 text-green-400 border border-green-500/20",
  };

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* Header */}

      <div className="mb-8">

        <div className="flex items-center gap-4">

          <ShieldAlert
            size={40}
            className="text-cyan-400"
          />

          <div>

            <h1 className="text-5xl font-bold text-white">
              Findings
            </h1>

            <p className="text-slate-400 mt-2">
              Security vulnerabilities identified
              across projects
            </p>

          </div>

        </div>

      </div>

      {/* Search / Filters */}

      <div
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-6
        mb-8
        "
      >
        <div className="grid md:grid-cols-3 gap-4">

          <div
            className="
            flex
            items-center
            gap-3
            bg-slate-950
            border
            border-slate-800
            rounded-xl
            px-4
            py-3
            "
          >
            <Search
              size={18}
              className="text-slate-500"
            />

            <input
              placeholder="Search findings..."
              disabled
              className="
              bg-transparent
              outline-none
              text-slate-300
              w-full
              "
            />
          </div>

          <div
            className="
            flex
            items-center
            gap-3
            bg-slate-950
            border
            border-slate-800
            rounded-xl
            px-4
            py-3
            text-slate-400
            "
          >
            <Filter size={18} />
            Severity Filter
          </div>

          <div
            className="
            flex
            items-center
            gap-3
            bg-slate-950
            border
            border-slate-800
            rounded-xl
            px-4
            py-3
            text-slate-400
            "
          >
            <Filter size={18} />
            Status Filter
          </div>

        </div>
      </div>

      {/* Findings Count */}

      <div className="mb-6">

        <p className="text-slate-400">
          {findings.length}
          {" "}
          findings discovered
        </p>

      </div>

      {/* Findings List */}

      <div className="space-y-4">

        {findings.map((finding) => (
          <Link
            key={finding.id}
            href={`/findings/${finding.id}`}
            className="
            block
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            hover:border-cyan-500
            hover:bg-slate-800/50
            transition-all
            "
          >
            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-xl font-semibold text-white">
                  {finding.title}
                </h2>

                <p className="text-slate-400 mt-2">
                  Project:
                  {" "}
                  {finding.project.name}
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <span className="text-slate-500 text-sm">
                    Owner:
                  </span>

                  <span
                    className="
                    px-2
                    py-1
                    rounded-lg
                    bg-cyan-500/10
                    text-cyan-400
                    text-xs
                    "
                  >
                    {finding.owner?.name ??
                      "Unassigned"}
                  </span>

                </div>

              </div>

              <div className="flex gap-2">

                <span
                  className={`
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    font-medium
                    ${
                      severityColors[
                        finding.severity
                      ] ??
                      "bg-slate-700 text-slate-300"
                    }
                  `}
                >
                  {finding.severity}
                </span>

                <span
                  className={`
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    ${
                      finding.status ===
                      "Closed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }
                  `}
                >
                  {finding.status}
                </span>

              </div>

            </div>

            {finding.description && (
              <p className="mt-4 text-slate-300 line-clamp-2">
                {finding.description}
              </p>
            )}

          </Link>
        ))}

      </div>

    </div>
  );
}
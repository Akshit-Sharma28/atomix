import { prisma } from "@/lib/prisma";
import Link from "next/link";

import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Brain,
  ClipboardList,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface Props {
  searchParams?: Promise<{
    q?: string;
    severity?: string;
    status?: string;
    projectId?: string;
    ai?: string;
  }>;
}

export default async function FindingsPage({
  searchParams,
}: Props) {
  const params =
    (await searchParams) ?? {};

  const query =
    params.q?.trim() ?? "";
  const severity =
    params.severity ?? "";
  const status =
    params.status ?? "";
  const projectId =
    params.projectId ?? "";
  const ai = params.ai ?? "";

  const where = {
      ...(query
        ? {
            OR: [
              {
                title: {
                  contains: query,
                },
              },
              {
                description: {
                  contains: query,
                },
              },
              {
                cweId: {
                  contains: query,
                },
              },
              {
                owaspCategory: {
                  contains: query,
                },
              },
            ],
          }
        : {}),
      ...(severity
        ? {
            severity,
          }
        : {}),
      ...(status
        ? {
            status,
          }
        : {}),
      ...(projectId
        ? {
            projectId,
          }
        : {}),
      ...(ai === "reviewed"
        ? {
            analysis: {
              isNot: null,
            },
          }
        : {}),
      ...(ai === "pending"
        ? {
            analysis: {
              is: null,
            },
          }
        : {}),
    };

  const [
    findings,
    projects,
  ] = await Promise.all([
  prisma.finding.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      status: true,
      source: true,
      cweId: true,
      owaspCategory: true,
      verified: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          sprId: true,
          name: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      analysis: {
        select: {
          id: true,
          riskScore: true,
        },
      },
      review: {
        select: {
          id: true,
          srId: true,
          title: true,
        },
      },
      component: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  }),
    prisma.project.findMany({
      select: {
        id: true,
        sprId: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const criticalCount = findings.filter(
    (f) => f.severity === "Critical"
  ).length;

  const openCount = findings.filter(
    (f) => f.status !== "Closed"
  ).length;

  const aiReviewedCount = findings.filter(
    (f) => f.analysis
  ).length;

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
    <div className="w-full px-8 py-6">
      {/* Header */}

      <div
        className="
        mb-6
        pb-5
        border-b
        border-slate-800
        "
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldAlert
              size={30}
              className="text-cyan-400"
            />

            <div>
              <div className="mb-2 text-sm text-slate-500">
                Portfolio / Findings
              </div>
              <h1 className="text-3xl font-bold text-white">
                Findings Governance
              </h1>

              <p className="text-slate-400 mt-1">
                Portfolio-level finding search, triage, retest readiness, and
                closure governance across SPRs/SRs.
              </p>
            </div>
          </div>

          <Link
            href="/my-findings"
            className="
            flex
            items-center
            gap-2
            px-4
            py-2.5
            rounded-xl
            bg-cyan-500
            text-black
            font-semibold
            hover:bg-cyan-400
            transition-all
            "
          >
            <Plus size={16} />
            Add Findings
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: ClipboardList,
            title: "Reviewer Entry",
            text: "Reviewers add initial findings from My Findings after selecting their assigned SPR/SR package.",
            href: "/my-findings",
            cta: "Open My Findings",
          },
          {
            icon: RotateCcw,
            title: "Retest Flow",
            text: "When app teams fix issues, retest requests are tracked in Retest Governance and mapped back to initial findings.",
            href: "/retest-governance",
            cta: "Open Retest Governance",
          },
          {
            icon: CheckCircle2,
            title: "Closure Decision",
            text: "If no open findings remain, the SPR can move toward closure; unresolved items need retest, remediation plan, or exception.",
            href: "/findings?status=Open",
            cta: "Review Open Findings",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-5"
            >
              <Icon className="text-cyan-300" size={24} />
              <h2 className="mt-4 text-lg font-bold text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.text}
              </p>
              <Link
                href={item.href}
                className="mt-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {item.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* KPI Row */}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Total Findings
          </p>

          <h3 className="text-2xl font-bold text-white mt-1">
            {findings.length}
          </h3>
        </div>

        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Critical
          </p>

          <h3 className="text-2xl font-bold text-red-400 mt-1">
            {criticalCount}
          </h3>
        </div>

        <div className="bg-slate-900 border border-blue-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Open Findings
          </p>

          <h3 className="text-2xl font-bold text-blue-400 mt-1">
            {openCount}
          </h3>
        </div>

        <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            AI Reviewed
          </p>

          <h3 className="text-2xl font-bold text-cyan-400 mt-1">
            {aiReviewedCount}
          </h3>
        </div>
      </div>

      {/* Filters */}

      <form
        action="/findings"
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-4
        mb-6
        "
      >
        <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-4">
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
              name="q"
              defaultValue={query}
              placeholder="Search findings..."
              className="
              bg-transparent
              outline-none
              text-slate-300
              w-full
              "
            />
          </div>

          <select
            name="severity"
            defaultValue={severity}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
          >
            <option value="">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Info">Info</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
          >
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Ready For Retest">Ready For Retest</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            name="projectId"
            defaultValue={projectId}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.sprId
                  ? `${project.sprId} · ${project.name}`
                  : project.name}
              </option>
            ))}
          </select>

          <select
            name="ai"
            defaultValue={ai}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
          >
            <option value="">AI status</option>
            <option value="reviewed">AI reviewed</option>
            <option value="pending">AI pending</option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-black hover:bg-cyan-400"
            >
              <Filter size={16} />
              Apply
            </button>

            <Link
              href="/findings"
              className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      {/* Findings Table */}

      <div
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        overflow-hidden
        "
      >
        <table className="w-full">
          <thead className="bg-slate-950">
            <tr className="text-left text-slate-400 text-sm">
              <th className="px-6 py-4">
                Finding
              </th>

              <th className="px-6 py-4">
                Severity
              </th>

              <th className="px-6 py-4">
                Risk
              </th>

              <th className="px-6 py-4">
                Status
              </th>

              <th className="px-6 py-4">
                Owner
              </th>

              <th className="px-6 py-4">
                AI
              </th>

              <th className="px-6 py-4">
                Verified
              </th>
            </tr>
          </thead>

          <tbody>
            {findings.map((finding) => (
              <tr
                key={finding.id}
                className="
                border-t
                border-slate-800
                hover:bg-slate-800/40
                transition-all
                "
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/findings/${finding.id}`}
                  >
                    <div>
                      <div className="font-medium text-white">
                        {finding.title}
                      </div>

                      <div className="text-sm text-slate-500 mt-1">
                        {finding.project.sprId ?? finding.project.name}
                        {" · "}
                        {finding.review?.srId ??
                          finding.review?.title ??
                          "No SR"}
                        {finding.component?.name
                          ? ` · ${finding.component.name}`
                          : ""}
                      </div>
                    </div>
                  </Link>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`
                      px-3
                      py-1
                      rounded-full
                      text-xs
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
                </td>

                <td className="px-6 py-4">
                  <span className="font-semibold text-cyan-400">
                    {finding.analysis?.riskScore ??
                      "-"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`
                    px-3
                    py-1
                    rounded-full
                    text-xs
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
                </td>

                <td className="px-6 py-4 text-slate-300">
                  {finding.owner?.name ??
                    "Unassigned"}
                </td>

                <td className="px-6 py-4">
                  {finding.analysis ? (
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Brain size={15} />
                      Yes
                    </div>
                  ) : (
                    <span className="text-slate-500">
                      No
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {finding.verified ? (
                    <span className="text-green-400">
                      ✓
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {findings.length === 0 && (
          <div className="border-t border-slate-800 p-10 text-center text-slate-500">
            No findings match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

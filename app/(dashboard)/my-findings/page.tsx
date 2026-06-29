import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/users/current-user.service";
import ControlFindingForm from "@/components/findings/control-finding-form";
import {
  Bot,
  ClipboardList,
  FilePlus2,
  User,
} from "lucide-react";

function severityClass(severity: string) {
  if (severity === "Critical") return "text-red-300";
  if (severity === "High") return "text-orange-300";
  if (severity === "Medium") return "text-yellow-300";
  if (severity === "Low") return "text-emerald-300";
  if (severity === "Informational") return "text-cyan-300";
  if (severity === "Not Rated") return "text-slate-300";
  return "text-emerald-300";
}

function statusClass(status: string) {
  if (status === "FAIL") return "bg-red-500/10 text-red-300";
  if (status === "PASS") return "bg-emerald-500/10 text-emerald-300";
  if (status === "Informational") return "bg-cyan-500/10 text-cyan-300";
  if (status === "Not Rated") return "bg-slate-700/60 text-slate-300";
  return "bg-blue-500/10 text-blue-300";
}

function formatDate(date?: Date | null) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function MyFindingsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    projectId?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return <div className="p-8 text-slate-300">User not found</div>;
  }

  const params = (await searchParams) ?? {};

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: {
      userId: currentUser.id,
    },
    include: {
      assignments: {
        include: {
          review: {
            include: {
              project: {
                include: {
                  findings: {
                    include: {
                      review: true,
                      owner: true,
                    },
                    orderBy: {
                      createdAt: "desc",
                    },
                  },
                },
              },
              findings: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  const assignmentPackages = new Map<
    string,
    {
      project: NonNullable<
        typeof reviewerProfile
      >["assignments"][number]["review"]["project"];
      reviews: NonNullable<typeof reviewerProfile>["assignments"][number]["review"][];
      status: "Assigned" | "Completed";
      role: string;
    }
  >();

  for (const assignment of reviewerProfile?.assignments ?? []) {
    const project = assignment.review.project;
    const existing = assignmentPackages.get(project.id);
    const completed =
      assignment.review.status === "Completed" ||
      assignment.status === "Completed";

    if (existing) {
      existing.reviews.push(assignment.review);
      if (!completed) {
        existing.status = "Assigned";
      }
      continue;
    }

    assignmentPackages.set(project.id, {
      project,
      reviews: [assignment.review],
      status: completed ? "Completed" : "Assigned",
      role: assignment.role,
    });
  }

  const packages = Array.from(assignmentPackages.values());
  const selectedPackage =
    packages.find((item) => item.project.id === params.projectId) ??
    packages[0];
  const selectedProject = selectedPackage?.project;
  const controlResults =
    selectedProject?.findings ?? [];
  const openFindings =
    selectedProject?.findings.filter(
      (finding) =>
        !["Closed", "PASS", "Informational", "Not Rated"].includes(
          finding.status,
        ),
    ) ?? [];
  const canCloseSpr =
    Boolean(selectedProject) && openFindings.length === 0;

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <User size={40} className="text-cyan-400" />
          <div>
            <div className="mb-2 text-sm text-slate-500">
              Reviewer Workspace / My Reviews
            </div>
            <h1 className="text-4xl font-bold text-white">
              My Assigned Reviews
            </h1>
            <p className="mt-2 text-slate-400">
              Select an assigned SPR, choose the SR, then record control-by-control
              results with Status, Risk, and reviewer comments.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Metric label="Assigned SPRs" value={packages.length} />
        <Metric
          label="Completed SPRs"
          value={
            packages.filter((item) => item.status === "Completed").length
          }
        />
        <Metric label="Open Findings" value={openFindings.length} />
        <Metric
          label="Ready to Close"
          value={canCloseSpr ? "Yes" : "No"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-xl font-bold text-white">
              Assigned / Completed SPRs
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Click a package to work SR control results.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {packages.length === 0 && (
              <div className="p-8 text-sm text-slate-400">
                No review packages assigned yet.
              </div>
            )}

            {packages.map((item) => {
              const active =
                selectedProject?.id === item.project.id;

              return (
                <Link
                  key={item.project.id}
                  href={`/my-findings?projectId=${item.project.id}`}
                  className={`block p-5 transition hover:bg-slate-800/60 ${
                    active ? "bg-cyan-500/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {item.project.sprId ?? item.project.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.project.name}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.reviews.length} SRs · {item.role}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        item.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-cyan-500/10 text-cyan-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {selectedProject ? (
          <section className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 text-sm text-cyan-300">
                    {selectedProject.sprId ?? "SPR pending"}
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    {selectedProject.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Add PASS, FAIL, Not Rated, or Informational control results
                    against the selected SR. Each saved result stays mapped to
                    the SR for review governance and reporting.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedPackage?.reviews.map((review) => (
                      <span
                        key={review.id}
                        className="rounded-full border border-cyan-400/20 bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200"
                      >
                        {review.srId ?? review.title} · {review.status}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/copilot?prompt=${encodeURIComponent(
                    `Act as the Add Findings Agent for ${selectedProject.sprId ?? selectedProject.name}. Help draft an SR-mapped control result with control ID, status PASS/FAIL/Not Rated/Informational, risk Critical/High/Medium/Low/Informational/Not Rated, reviewer comment, evidence, impact, and remediation.`,
                  )}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"
                >
                  <Bot size={16} />
                  Add Findings Agent
                </Link>
              </div>
            </div>

            <FindingList
              title="SR Control Results"
              findings={controlResults}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center gap-3">
                <FilePlus2 className="text-cyan-300" size={22} />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Add Control Result to Selected SR
                  </h2>
                  <p className="text-sm text-slate-400">
                    Pick the SR, choose the control, set PASS/FAIL/Not Rated/
                    Informational, select Risk, and add reviewer comments.
                  </p>
                </div>
              </div>

              <ControlFindingForm
                projectId={selectedProject.id}
                ownerId={currentUser.id}
                reviews={
                  selectedPackage?.reviews.map((review) => ({
                    id: review.id,
                    label: `${review.srId ?? review.title} · ${review.status}`,
                  })) ?? []
                }
              />
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">
                SPR Closure Logic
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                SPR can be closed once there are no FAIL/open findings. PASS,
                Informational, and Not Rated control results remain visible for
                evidence and governance history.
              </p>
              <p className="mt-3 text-sm font-semibold text-cyan-200">
                Current state:{" "}
                {canCloseSpr
                  ? "No FAIL/open findings — ready for closure review."
                  : `${openFindings.length} FAIL/open results still need closure, retest, remediation plan, or exception.`}
              </p>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            No assigned SPR selected.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-cyan-300">{value}</p>
    </div>
  );
}

function FindingList({
  title,
  findings,
}: {
  title: string;
  findings: {
    id: string;
    title: string;
    severity: string;
    status: string;
    source: string;
    dueDate: Date | null;
    review: {
      srId: string | null;
      title: string;
    } | null;
  }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-800 p-5">
        <ClipboardList className="text-cyan-300" size={22} />
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-slate-400">
            {findings.length} saved control results / findings
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {findings.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            No control results recorded yet.
          </div>
        )}
        {findings.map((finding) => (
          <Link
            key={finding.id}
            href={`/findings/${finding.id}`}
            className="block p-5 hover:bg-slate-800/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{finding.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {finding.review?.srId ?? finding.review?.title ?? "No SR"} ·{" "}
                  {finding.source}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full bg-slate-950 px-3 py-1 text-xs ${severityClass(
                      finding.severity,
                    )}`}
                  >
                    Risk: {finding.severity}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${statusClass(
                      finding.status,
                    )}`}
                  >
                    Status: {finding.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {formatDate(finding.dueDate)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

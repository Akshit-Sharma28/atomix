import ImportUploader from "@/components/import/import-uploader";
import AIReportReviewer from "@/components/import/ai-report-reviewer";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/users/current-user.service";
import { normalizeRole } from "@/services/users/access.service";
import {
  Archive,
  FileSearch,
  FolderOpen,
  LockKeyhole,
  ShieldCheck,
  Upload,
} from "lucide-react";

const broadVisibilityRoles = new Set([
  "ADMIN",
  "GOVERNANCE_TEAM",
  "EXECUTIVE",
  "VALIDATOR",
  "ENGAGEMENT_MANAGER",
]);

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function typeTone(type?: string | null) {
  if (type?.includes("FEAD")) {
    return "bg-violet-500/10 text-violet-200";
  }

  if (type?.includes("Scan")) {
    return "bg-cyan-500/10 text-cyan-200";
  }

  if (type?.includes("Evidence")) {
    return "bg-emerald-500/10 text-emerald-200";
  }

  return "bg-slate-800 text-slate-300";
}

export default async function ImportPage() {
  const currentUser = await getCurrentUser();
  const activeRole = normalizeRole(currentUser?.role);
  const canSeeAll = broadVisibilityRoles.has(activeRole);

  const assignmentScope = currentUser
    ? await prisma.reviewerAssignment.findMany({
        where: {
          userId: currentUser.id,
        },
        select: {
          reviewId: true,
          review: {
            select: {
              projectId: true,
            },
          },
        },
      })
    : [];

  const managedProjects = currentUser
    ? await prisma.project.findMany({
        where: {
          projectManagerId: currentUser.id,
        },
        select: {
          id: true,
        },
      })
    : [];

  const visibleReviewIds = Array.from(
    new Set(assignmentScope.map((item) => item.reviewId))
  );
  const managedProjectIds = managedProjects.map((project) => project.id);
  const visibleProjectIds = Array.from(
    new Set([
      ...assignmentScope.map((item) => item.review.projectId),
      ...managedProjectIds,
    ])
  );

  const [projects, documents] = await Promise.all([
    prisma.project.findMany({
      where: canSeeAll
        ? undefined
        : {
            id: {
              in: visibleProjectIds,
            },
          },
      select: {
        id: true,
        name: true,
        sprId: true,
        reviews: {
          where: canSeeAll
            ? undefined
            : {
                OR: [
                  {
                    id: {
                      in: visibleReviewIds,
                    },
                  },
                  {
                    projectId: {
                      in: managedProjectIds,
                    },
                  },
                ],
              },
          select: {
            id: true,
            srId: true,
            title: true,
            type: true,
            status: true,
            projectId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.knowledgeDocument.findMany({
      where: canSeeAll
        ? undefined
        : {
            OR: [
              {
                uploadedById: currentUser?.id,
              },
              {
                reviewId: {
                  in: visibleReviewIds,
                },
              },
              {
                projectId: {
                  in: visibleProjectIds,
                },
              },
            ],
          },
      orderBy: {
        createdAt: "desc",
      },
      take: 40,
    }),
  ]);

  const reviews = projects
    .flatMap((project) => {
      let retestCounter = 1;

      return [...project.reviews]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((review) => {
          const isRetest = `${review.type} ${review.title}`
            .toLowerCase()
            .includes("retest");
          const iteration = isRetest ? `1.${++retestCounter}` : "1.0";

          return {
            id: review.id,
            srId: review.srId,
            title: review.title,
            status: review.status,
            projectId: review.projectId,
            iteration,
          };
        });
    })
    .sort((a, b) => (a.srId ?? a.title).localeCompare(b.srId ?? b.title));
  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
    sprId: project.sprId,
  }));
  const mappedDocuments = documents.filter((document) => document.projectId);
  const iterations = new Set(documents.map((document) => document.iteration));

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6 pr-48">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <FolderOpen size={42} className="text-cyan-300" />
            <div>
              <div className="mb-2 text-sm text-slate-500">Import</div>
              <h1 className="text-4xl font-bold text-white">
                Review Document Vault
              </h1>
              <p className="mt-2 max-w-4xl text-slate-400">
                A SharePoint-style evidence bank for every review. Upload FEAD,
                BEAD, LLM FEAD, scan reports, diagrams, screenshots, and
                retest evidence against an SPR, SR, and review iteration.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
              Visibility model
            </p>
            <p className="mt-2 max-w-sm text-sm text-slate-300">
              Reviewers and QA reviewers see assigned review files. Governance,
              compliance-style oversight, executives, validators, and admins
              can review the full vault.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          {
            icon: Archive,
            label: "Vault documents",
            value: documents.length,
            helper: "visible to your role",
          },
          {
            icon: ShieldCheck,
            label: "Mapped to reviews",
            value: mappedDocuments.length,
            helper: "SPR/SR linked artifacts",
          },
          {
            icon: FileSearch,
            label: "Iterations",
            value: iterations.size,
            helper: "1.0, 1.2, 1.3...",
          },
          {
            icon: LockKeyhole,
            label: "Access mode",
            value: canSeeAll ? "All" : "Assigned",
            helper: activeRole.replaceAll("_", " "),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <card.icon className="mb-4 text-cyan-300" size={22} />
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <AIReportReviewer projects={projectOptions} reviews={reviews} />
          <details className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <summary className="cursor-pointer list-none text-lg font-bold text-white">
              Advanced: Burp XML finding import
              <span className="ml-3 text-sm font-normal text-slate-500">
                Store scanner XML against the same SPR/SR folder
              </span>
            </summary>
            <div className="mt-5">
              <ImportUploader projects={projectOptions} reviews={reviews} />
            </div>
          </details>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <div className="flex items-start gap-3">
              <Upload className="text-cyan-300" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Vault index
                </h2>
                <p className="text-sm text-slate-400">
                  Latest review artifacts grouped by SPR, SR, iteration, and
                  artifact type.
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[680px] overflow-auto divide-y divide-slate-800">
            {documents.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No review documents are visible for your current role.
              </div>
            )}

            {documents.map((document) => (
              <div key={document.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{document.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {document.sprId ?? "SPR pending"} ·{" "}
                      {document.srId ?? "SR not selected"} · Iteration{" "}
                      {document.iteration}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${typeTone(
                      document.artifactType,
                    )}`}
                  >
                    {document.artifactType}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <p className="text-slate-500">Source</p>
                    <p className="mt-1 text-slate-300">
                      {document.scanner ?? document.source}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <p className="text-slate-500">Visibility</p>
                    <p className="mt-1 text-slate-300">
                      {document.visibility.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <p className="text-slate-500">Uploaded</p>
                    <p className="mt-1 text-slate-300">
                      {formatDate(document.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                  {document.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

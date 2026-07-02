import ImportUploader from "@/components/import/import-uploader";
import AIReportReviewer from "@/components/import/ai-report-reviewer";
import PendingSubmitButton from "@/components/ui/pending-submit-button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/users/current-user.service";
import { normalizeRole } from "@/services/users/access.service";
import {
  deleteVaultDocument,
  updateVaultDocument,
} from "./actions";
import {
  Archive,
  Edit3,
  FileSearch,
  FolderOpen,
  LockKeyhole,
  ShieldCheck,
  Trash2,
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

export default async function ImportPage({
  searchParams,
}: {
  searchParams?: Promise<{
    removed?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
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
  const folderGroups = Array.from(
    documents.reduce((groups, document) => {
      const folderName =
        document.folderName?.trim() ||
        [
          document.sprId ?? "Unassigned SPR",
          document.srId ?? "Unassigned SR",
          `Iteration ${document.iteration}`,
        ].join(" / ");
      const group = groups.get(folderName) ?? [];

      group.push(document);
      groups.set(folderName, group);

      return groups;
    }, new Map<string, typeof documents>()),
  ).map(([folderName, folderDocuments]) => ({
    folderName,
    documents: folderDocuments,
  }));

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 sm:px-6 xl:px-8">
      <div className="mb-8 border-b border-slate-800 pb-6 xl:pr-32">
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

      <div className="grid min-w-0 max-w-full gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
        <div className="min-w-0 space-y-6">
          <AIReportReviewer projects={projectOptions} reviews={reviews} />
          <details className="group min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-lg font-bold text-white">
              <span>Advanced: Burp XML finding import</span>
              <span className="ml-3 text-sm font-normal text-slate-500">
                Store scanner XML against the same SPR/SR folder
              </span>
            </summary>
            <div className="mt-5 min-w-0">
              <ImportUploader projects={projectOptions} reviews={reviews} />
            </div>
          </details>
        </div>

        <section
          id="vault-index"
          className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
        >
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

          {params.removed === "1" && (
            <div className="mx-6 mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
              Document removed from the review vault.
            </div>
          )}

          <div className="max-h-[680px] overflow-y-auto overflow-x-hidden">
            {documents.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No review documents are visible for your current role.
              </div>
            )}

            {folderGroups.map((folder) => (
              <details
                key={folder.folderName}
                open
                className="border-b border-slate-800"
              >
                <summary className="sticky top-0 z-10 flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-6 py-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <FolderOpen size={18} className="shrink-0 text-cyan-300" />
                    <span className="truncate font-bold text-white">
                      {folder.folderName}
                    </span>
                  </span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-slate-400">
                    {folder.documents.length} documents
                  </span>
                </summary>

                <div className="divide-y divide-slate-800">
                  {folder.documents.map((document) => (
                    <div key={document.id} className="min-w-0 px-6 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {document.title}
                          </p>
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

                      <div className="mt-4 grid min-w-0 gap-3 text-xs text-slate-400 sm:grid-cols-3 2xl:grid-cols-1">
                        <div className="min-w-0 rounded-xl bg-slate-950 px-3 py-2">
                          <p className="text-slate-500">Source</p>
                          <p className="mt-1 truncate text-slate-300">
                            {document.scanner ?? document.source}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-xl bg-slate-950 px-3 py-2">
                          <p className="text-slate-500">Visibility</p>
                          <p className="mt-1 truncate text-slate-300">
                            {document.visibility.replaceAll("_", " ")}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-xl bg-slate-950 px-3 py-2">
                          <p className="text-slate-500">Uploaded</p>
                          <p className="mt-1 truncate text-slate-300">
                            {formatDate(document.createdAt)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                        {document.content}
                      </p>

                      <details className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-cyan-200">
                          <Edit3 size={15} />
                          Edit document metadata
                        </summary>
                        <form action={updateVaultDocument} className="mt-4 grid gap-3">
                          <input type="hidden" name="documentId" value={document.id} />
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                Title
                              </span>
                              <input
                                name="title"
                                defaultValue={document.title}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                Folder
                              </span>
                              <input
                                name="folderName"
                                defaultValue={folder.folderName}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                Artifact type
                              </span>
                              <select
                                name="artifactType"
                                defaultValue={document.artifactType}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              >
                                {[
                                  "FEAD",
                                  "BEAD",
                                  "LLM FEAD",
                                  "Scan Report",
                                  "Architecture Diagram",
                                  "Demo Call Notes",
                                  "Evidence Images",
                                  "Remediation Evidence",
                                  "Exception Evidence",
                                ].map((type) => (
                                  <option key={type}>{type}</option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                Source
                              </span>
                              <input
                                name="scanner"
                                defaultValue={document.scanner ?? "Manual / Evidence"}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                Visibility
                              </span>
                              <select
                                name="visibility"
                                defaultValue={document.visibility}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              >
                                <option value="REVIEW_TEAM">Review team only</option>
                                <option value="GOVERNANCE">Governance visible</option>
                                <option value="LEADERSHIP">Leadership summary visible</option>
                              </select>
                            </label>
                          </div>
                          <label className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                              Document notes / extracted content
                            </span>
                            <textarea
                              name="content"
                              rows={4}
                              defaultValue={document.content}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                          </label>
                          <div className="flex flex-wrap gap-3">
                            <button className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
                              Save document
                            </button>
                          </div>
                        </form>
                      </details>

                      <form action={deleteVaultDocument} className="mt-3">
                        <input type="hidden" name="documentId" value={document.id} />
                        <PendingSubmitButton
                          pendingLabel="Removing..."
                          className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                          Remove from vault
                        </PendingSubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

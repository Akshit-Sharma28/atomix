import Link from "next/link";
import { ArrowLeft, ClipboardList, UserCheck } from "lucide-react";

import ScopeCallAgent from "@/components/agents/scope-call-agent";
import { prisma } from "@/lib/prisma";
import { canAccess, getActiveRole } from "@/services/users/access.service";
import { getCurrentUser } from "@/services/users/current-user.service";
import { assignValidatorToSpr } from "./actions";

export default async function ScopeCallWorkflowPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const [allowed, activeRole, currentUser, canAssignValidator] =
    await Promise.all([
      canAccess([
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "PROJECT_MANAGER",
        "CONSULTANT",
      ]),
      getActiveRole(),
      getCurrentUser(),
      canAccess(["ADMIN", "GOVERNANCE_TEAM"]),
    ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Scope agent access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            Demo Call Agent is available to Governance, Validator, Project
            Manager, and Consultant roles.
          </p>
        </div>
      </div>
    );
  }

  const [projects, validators] = await Promise.all([
    prisma.project.findMany({
      where:
        activeRole === "VALIDATOR" && currentUser
          ? {
              validatorId: currentUser.id,
            }
          : activeRole === "PROJECT_MANAGER" && currentUser
            ? {
                projectManagerId: currentUser.id,
              }
            : undefined,
      select: {
        id: true,
        name: true,
        sprId: true,
        riskTier: true,
        businessOwner: true,
        validator: {
          select: {
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            id: true,
            srId: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: "VALIDATOR",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);
  const params = await searchParams;

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <Link
          href="/workflow"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={16} />
          Back to Workflow
        </Link>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <ClipboardList size={16} />
          Demo Call Agent
        </div>
        <h1 className="text-3xl font-bold text-white">Demo Call Agent</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Capture application intake, generate a risk profile, validate CIA
          permutations, and produce a customized FEAD draft before testing
          starts.
        </p>
      </div>

      {(params?.error || params?.success) && (
        <div
          className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${
            params.error
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {params.error ?? params.success}
        </div>
      )}

      {canAssignValidator && (
        <section className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
          <div className="mb-4 flex items-start gap-3">
            <UserCheck className="text-cyan-300" size={22} />
            <div>
              <h2 className="text-xl font-bold text-white">
                Assign Validator to Demo Call SPR
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Map the long-lived SPR to a validator so it appears in the
                Demo Call Agent intake list for that user.
              </p>
            </div>
          </div>
          <form
            action={assignValidatorToSpr}
            className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]"
          >
            <select
              name="projectId"
              defaultValue=""
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white"
              required
            >
              <option value="">Select SPR / information system</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.sprId ?? "SPR pending"} · {project.name}
                  {project.validator
                    ? ` · current validator ${project.validator.name}`
                    : ""}
                </option>
              ))}
            </select>
            <select
              name="validatorId"
              defaultValue=""
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white"
              required
            >
              <option value="">Select validator</option>
              {validators.map((validator) => (
                <option key={validator.id} value={validator.id}>
                  {validator.name} · {validator.email}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300">
              Assign SPR
            </button>
          </form>
        </section>
      )}

      <ScopeCallAgent
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          sprId: project.sprId,
          riskTier: project.riskTier,
          businessOwner: project.businessOwner,
          validatorName: project.validator?.name ?? null,
          reviews: project.reviews,
        }))}
      />
    </div>
  );
}

import Link from "next/link";
import {
  Bot,
  ClipboardList,
  FileSearch,
  GitBranch,
  ListChecks,
  ShieldCheck,
  TerminalSquare,
  UserPlus,
} from "lucide-react";

import { canAccess, normalizeRole } from "@/services/users/access.service";
import { getCurrentUser } from "@/services/users/current-user.service";
import { prisma } from "@/lib/prisma";
import {
  assignReviewToReviewer,
  createReviewerProfile,
  createSecurityReview,
} from "./actions";

function cleanRole(role: string) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE TEAM";
  }

  if (role === "DEVELOPER") {
    return "REVIEWER";
  }

  if (role === "VIEWER" || role === "CONSULTANT") {
    return "REVIEWER";
  }

  return role.replaceAll("_", " ");
}

const agentWorkflows = [
  {
    title: "Validator / Demo Call Agent",
    href: "/workflow/scope-call",
    mode: "Structured intake",
    description:
      "Collect demo-call scope, URL/IP, risk, AV/Au, RBAC roles, artifacts, and scan evidence into a pre-review scope document.",
    icon: ClipboardList,
    roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR", "PROJECT_MANAGER"],
  },
  {
    title: "Peer Review Agent",
    href: "/workflow/peer-review",
    mode: "Artifact review",
    description:
      "Review FEAD, BEAD, LLM FEAD, and scan evidence against scope and control coverage before reviewer sign-off.",
    icon: FileSearch,
    roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR", "QA_REVIEWER", "REVIEWER"],
  },
  {
    title: "Reviewer Copilot Agent",
    href: "/workflow/reviewer-copilot",
    mode: "Reviewer assist",
    description:
      "Run passive web posture checks, build reviewer test plans, and use an authorized LLM prompt library during infosec reviews.",
    icon: ShieldCheck,
    roles: [
      "ADMIN",
      "GOVERNANCE_TEAM",
      "VALIDATOR",
      "QA_REVIEWER",
      "REVIEWER",
      "RETESTER",
    ],
  },
  {
    title: "DB Action Builder Agent",
    href: "/workflow/command-center",
    mode: "DB write actions",
    description:
      "Use forms to create governed user/project/SR/finding records through whitelisted, role-checked API commands.",
    icon: TerminalSquare,
    roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR"],
  },
  {
    title: "Security Copilot",
    href: "/copilot",
    mode: "Advisory chat",
    description:
      "Ask portfolio or finding questions. Copilot helps draft and reason, but does not autonomously change records.",
    icon: Bot,
    roles: [
      "ADMIN",
      "GOVERNANCE_TEAM",
      "VALIDATOR",
      "QA_REVIEWER",
      "REVIEWER",
      "RETESTER",
      "PROJECT_MANAGER",
      "ENGAGEMENT_MANAGER",
    ],
  },
];

export default async function WorkflowPage() {
  const currentUser = await getCurrentUser();
  const activeRole = normalizeRole(currentUser?.role);
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "REVIEWER",
    "RETESTER",
    "PROJECT_MANAGER",
    "ENGAGEMENT_MANAGER",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Workflow access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            Workflow is available to Atomix governance, validator, reviewer,
            retester, project manager, and engagement roles only.
          </p>
        </div>
      </div>
    );
  }

  const [projects, users, reviewerProfiles, reviews] = await Promise.all([
    prisma.project.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.reviewerProfile.findMany({
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
    prisma.securityReview.findMany({
      where: {
        status: {
          notIn: ["Completed", "Cancelled"],
        },
      },
      include: {
        project: true,
        assignments: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const reviewerCandidateRoles = [
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "REVIEWER",
        "RETESTER",
    "SECURITY_LEAD",
    "DEVELOPER",
  ];
  const reviewerCandidates = users.filter((user) =>
    reviewerCandidateRoles.includes(user.role),
  );
  const visibleAgentWorkflows = agentWorkflows.filter((workflow) =>
    workflow.roles.includes(activeRole),
  );
  const canManageCapacity = ["ADMIN", "GOVERNANCE_TEAM"].includes(activeRole);
  const canCreateReview = ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR"].includes(
    activeRole,
  );
  const canAssignReview = ["ADMIN", "GOVERNANCE_TEAM"].includes(activeRole);

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <GitBranch size={16} />
          Governance Readiness Workflow
        </div>
        <h1 className="text-3xl font-bold text-white">
          Workflow
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Role-specific workspace for the current user. Atomix only shows the
          workflow agents and actions that match your RBAC context.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          ["Projects", projects.length, "available for SR intake"],
          ["Reviewer Profiles", reviewerProfiles.length, "capacity records"],
          [
            "Unassigned SRs",
            reviews.filter((review) => review.assignments.length === 0).length,
            "need governance action",
          ],
        ].map(([label, value, helper]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-5"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {label as string}
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {value as number}
            </p>
            <p className="mt-2 text-sm text-slate-400">{helper as string}</p>
          </div>
        ))}
      </div>

      <section className="mb-8 rounded-[1.75rem] border border-cyan-400/20 bg-slate-900/70 p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <GitBranch size={17} />
              Your Workflow Agents
            </div>
            <h2 className="text-2xl font-bold text-white">
              Available for {cleanRole(activeRole)}.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              Agents are separated in the sidebar for quick access. This page
              only surfaces the agent-assisted workflows relevant to the current
              role so validators, reviewers, retesters, and governance users do
              not see the same crowded workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {visibleAgentWorkflows.map((workflow) => {
            const Icon = workflow.icon;

            return (
              <Link
                key={workflow.title}
                href={workflow.href}
                className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
                    <Icon size={21} />
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                    {workflow.mode}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {workflow.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {workflow.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-cyan-300 group-hover:text-cyan-200">
                  Open workspace →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
        <h2 className="text-lg font-bold text-white">
          Agent capability model
        </h2>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-300 lg:grid-cols-3">
          <div>
            <p className="font-semibold text-amber-200">What is agentic now</p>
            <p className="mt-1 text-slate-400">
              Scope, peer review, and command workflows use structured APIs,
              role checks, typed inputs, and AI-generated recommendations.
            </p>
          </div>
          <div>
            <p className="font-semibold text-amber-200">What is advisory</p>
            <p className="mt-1 text-slate-400">
              Copilot prompts draft, summarize, and reason from current data;
              assignment and intake recommendations still need a human to apply
              them through the Workflow forms.
            </p>
          </div>
          <div>
            <p className="font-semibold text-amber-200">What comes next</p>
            <p className="mt-1 text-slate-400">
              A full autonomous agent would add planner/tool loops, dry-run vs
              apply modes, audit logs, retries, policy gates, and model evals.
            </p>
          </div>
        </div>
      </section>

      {(canManageCapacity || canCreateReview || canAssignReview) && (
        <div className="grid gap-6 xl:grid-cols-3">
          {canManageCapacity && (
            <form
              action={createReviewerProfile}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="text-cyan-300" size={22} />
            <h2 className="text-xl font-bold text-white">
              1. Add Reviewer Capacity
            </h2>
          </div>

          <label className="mb-2 block text-sm text-slate-400">User</label>
          <select
            name="userId"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            required
          >
            <option value="">Select user</option>
            {reviewerCandidates.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} · {cleanRole(user.role)}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-sm text-slate-400">
            Availability
          </label>
          <select
            name="availability"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          >
            <option>Available</option>
            <option>Limited</option>
            <option>On Leave</option>
            <option>Unavailable</option>
          </select>

          <label className="mb-2 block text-sm text-slate-400">
            Weekly capacity hours
          </label>
          <input
            name="weeklyCapacityHours"
            type="number"
            min="0"
            defaultValue="20"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          />

          <label className="mb-2 block text-sm text-slate-400">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            placeholder="Skill coverage, leave notes, review limits..."
          />

          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
            Save Capacity
          </button>
            </form>
          )}

          {canCreateReview && (
            <form
              action={createSecurityReview}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
          <div className="mb-5 flex items-center gap-3">
            <ClipboardList className="text-cyan-300" size={22} />
            <h2 className="text-xl font-bold text-white">2. Create SR Work</h2>
          </div>

          <label className="mb-2 block text-sm text-slate-400">Project</label>
          <select
            name="projectId"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} · {project.sprId ?? "SPR pending"}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-sm text-slate-400">
            Review title
          </label>
          <input
            name="title"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            placeholder="Customer Portal API Review"
            required
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">Type</label>
              <select
                name="type"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                <option>PENTEST</option>
                <option>API</option>
                <option>WEB</option>
                <option>LLM</option>
                <option>MOBILE</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Priority
              </label>
              <select
                name="priority"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Requested start
              </label>
              <input
                name="requestedStartDate"
                type="date"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Due date
              </label>
              <input
                name="dueDate"
                type="date"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              />
            </div>
          </div>

          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
            Create SR
          </button>
            </form>
          )}

          {canAssignReview && (
            <form
              action={assignReviewToReviewer}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
          <div className="mb-5 flex items-center gap-3">
            <ListChecks className="text-cyan-300" size={22} />
            <h2 className="text-xl font-bold text-white">
              3. Assign Reviewer
            </h2>
          </div>

          <label className="mb-2 block text-sm text-slate-400">
            Security Review
          </label>
          <select
            name="reviewId"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            required
          >
            <option value="">Select SR</option>
            {reviews.map((review) => (
              <option key={review.id} value={review.id}>
                {review.srId ?? review.title} · {review.project.name}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-sm text-slate-400">Reviewer</label>
          <select
            name="reviewerProfileId"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            required
          >
            <option value="">Select reviewer</option>
            {reviewerProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.user.name} · {profile.availability} ·{" "}
                {profile.weeklyCapacityHours}h
              </option>
            ))}
          </select>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Assignment role
              </label>
              <select
                name="role"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                <option>Reviewer</option>
                <option>Retester</option>
                <option>QA Reviewer</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Allocated hours
              </label>
              <input
                name="allocatedHours"
                type="number"
                min="1"
                defaultValue="8"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              />
            </div>
          </div>

          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
            Assign Reviewer
          </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

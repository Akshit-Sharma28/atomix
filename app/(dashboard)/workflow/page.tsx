import {
  ClipboardList,
  GitBranch,
  ListChecks,
  UserPlus,
} from "lucide-react";

import { canAccess } from "@/services/users/access.service";
import { prisma } from "@/lib/prisma";
import {
  assignReviewToReviewer,
  createReviewerProfile,
  createSecurityReview,
} from "./actions";
import AgenticCapabilityPanel from "@/components/agents/agentic-capability-panel";
import AgentCommandConsole from "@/components/agents/agent-command-console";
import PeerReviewAgent from "@/components/agents/peer-review-agent";
import ScopeCallAgent from "@/components/agents/scope-call-agent";

function cleanRole(role: string) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE TEAM";
  }

  if (role === "DEVELOPER") {
    return "REVIEWER";
  }

  if (role === "VIEWER") {
    return "CONSULTANT";
  }

  return role.replaceAll("_", " ");
}

export default async function WorkflowPage() {
  const allowed = await canAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Workflow access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            Project assignment workflow is available to Admin and Governance
            Team roles only.
          </p>
        </div>
      </div>
    );
  }

  const [projects, users, reviewerProfiles, reviews] =
    await Promise.all([
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
    "QA_REVIEWER",
    "REVIEWER",
    "CONSULTANT",
    "SECURITY_LEAD",
    "DEVELOPER",
  ];
  const reviewerCandidates = users.filter((user) =>
    reviewerCandidateRoles.includes(user.role),
  );

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <GitBranch size={16} />
          Governance Workflow
        </div>
        <h1 className="text-3xl font-bold text-white">
          Project Assignment Workflow
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Governance layer for creating reviewer capacity, creating SR work,
          and assigning projects/reviews to reviewers. This keeps operational
          allocation separate from user administration and reviewer execution.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          ["Projects", projects.length, "available for SR intake"],
          ["Reviewer Profiles", reviewerProfiles.length, "capacity records"],
          [
            "Unassigned SRs",
            reviews.filter((review) => review.assignments.length === 0)
              .length,
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
            <p className="mt-2 text-sm text-slate-400">
              {helper as string}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <AgenticCapabilityPanel
          context="workflow"
          metrics={[
            {
              label: "Projects ready",
              value: projects.length,
            },
            {
              label: "Reviewer profiles",
              value: reviewerProfiles.length,
            },
            {
              label: "Open SRs",
              value: reviews.length,
            },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
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

          <label className="mb-2 block text-sm text-slate-400">
            User
          </label>
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

          <label className="mb-2 block text-sm text-slate-400">
            Notes
          </label>
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

        <form
          action={createSecurityReview}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className="mb-5 flex items-center gap-3">
            <ClipboardList className="text-cyan-300" size={22} />
            <h2 className="text-xl font-bold text-white">
              2. Create SR Work
            </h2>
          </div>

          <label className="mb-2 block text-sm text-slate-400">
            Project
          </label>
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
              <label className="mb-2 block text-sm text-slate-400">
                Type
              </label>
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

          <label className="mb-2 block text-sm text-slate-400">
            Reviewer
          </label>
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
                <option>Primary</option>
                <option>Peer Reviewer</option>
                <option>QA Reviewer</option>
                <option>Shadow</option>
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
      </div>

      <ScopeCallAgent />

      <PeerReviewAgent />

      <AgentCommandConsole />
    </div>
  );
}

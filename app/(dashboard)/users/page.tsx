import SwitchUserButton from "@/components/users/switch-user-button";
import { getUsers } from "@/services/users/user.service";

const roleDefinitions = [
  {
    role: "ADMIN",
    title: "Admin",
    detail:
      "Full control over users, governance setup, assignments, reports, and system configuration.",
  },
  {
    role: "GOVERNANCE_TEAM",
    title: "Governance Team",
    detail:
      "Tracks pentester pool availability, project assignment health, red engagements, extensions, and chargeability signals. Admin can edit this operating role.",
  },
  {
    role: "QA_REVIEWER",
    title: "QA Reviewer",
    detail:
      "Assigned peer reviews, reviewer quality gates, evidence consistency, and report-readiness checks.",
  },
  {
    role: "REVIEWER",
    title: "Reviewer",
    detail:
      "Performs review execution, validates findings, updates assigned SR work, and supports closure.",
  },
  {
    role: "ENGAGEMENT_MANAGER",
    title: "Engagement Manager",
    detail:
      "Can access delivery pages, projects, reports, reviews, SLA, and governance views except Users.",
  },
  {
    role: "CONSULTANT",
    title: "Consultant",
    detail:
      "Works assigned findings and SLA items, drafts evidence, and collaborates with reviewers.",
  },
];

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

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
          Access Governance
        </p>
        <h1 className="mt-3 text-5xl font-bold">
          Atomix User Roles
        </h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          A focused role model for pentest delivery governance. Atomix controls
          operational visibility, reviewer capacity, peer review flow, and SLA
          work across APIM, SPR, and SR context.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roleDefinitions.map((item) => (
          <article
            key={item.role}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-white">
                {item.title}
              </h2>
              <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-200">
                {item.role}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {item.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-5">
          <h2 className="text-xl font-bold">
            Current Team Directory
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Admins can use switch-user during demos and edit governance fields
            from reviewer profile workflows.
          </p>
        </div>
        <table className="w-full">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="p-4 text-left">
                User
              </th>
              <th className="p-4 text-left">
                Role
              </th>
              <th className="p-4 text-left">
                Availability
              </th>
              <th className="p-4 text-left">
                Assigned Work
              </th>
              <th className="p-4 text-left">
                QA / Peer Reviews
              </th>
              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const currentAssignment =
                user.reviewerProfile?.assignments[0];

              return (
                <tr
                  key={user.id}
                  className="border-b border-slate-800 last:border-b-0"
                >
                  <td className="p-4">
                    <p className="font-semibold text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {user.email}
                    </p>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {cleanRole(user.role)}
                    </span>
                  </td>

                  <td className="p-4 text-slate-300">
                    {user.reviewerProfile?.availability ?? "Not tracked"}
                    <p className="mt-1 text-xs text-slate-500">
                      {user.reviewerProfile?.weeklyCapacityHours ?? 0}h weekly
                      capacity
                    </p>
                  </td>

                  <td className="p-4 text-slate-300">
                    {currentAssignment?.review.project.name ??
                      "Unassigned"}
                    <p className="mt-1 text-xs text-slate-500">
                      {currentAssignment?.review.project.sprId ??
                        "SPR pending"}{" "}
                      ·{" "}
                      {currentAssignment?.review.srId ??
                        "SR pending"}
                    </p>
                  </td>

                  <td className="p-4 text-slate-300">
                    {user._count.reviewAssignments} review assignments
                    <p className="mt-1 text-xs text-slate-500">
                      {user._count.assignedFindings} findings owned
                    </p>
                  </td>

                  <td className="p-4">
                    <SwitchUserButton userId={user.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

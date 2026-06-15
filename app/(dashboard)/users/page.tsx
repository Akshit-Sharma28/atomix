import Link from "next/link";
import { UserCog, UsersRound } from "lucide-react";

import SwitchUserButton from "@/components/users/switch-user-button";
import { getUsers } from "@/services/users/user.service";

const roleDefinitions = [
  ["ADMIN", "Admin", "Full platform administration and role control."],
  [
    "GOVERNANCE_TEAM",
    "Governance Team",
    "Owns reviewer allocation, workflow intake, tracker health, and SR assignment.",
  ],
  [
    "EXECUTIVE",
    "Executive",
    "Leadership view for portfolio health, variance, project risk, and trend signals.",
  ],
  [
    "QA_REVIEWER",
    "QA Reviewer",
    "Handles quality gates and peer-review evidence checks.",
  ],
  ["REVIEWER", "Reviewer", "Executes assigned security review work."],
  [
    "ENGAGEMENT_MANAGER",
    "Engagement Manager",
    "Coordinates delivery across projects without user administration access.",
  ],
  ["CONSULTANT", "Consultant", "Works assigned findings and SLA tasks."],
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            User Administration
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Users & Access Roles
          </h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Keep this page focused on identity, role visibility, and account
            state. Reviewer workload, QA pool, availability, assigned work, and
            peer review operations now live in Pentester Tracker.
          </p>
        </div>

        <Link
          href="/workflow"
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/15"
        >
          Open Governance Workflow
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roleDefinitions.map(([role, title, detail]) => (
          <article
            key={role}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-white">
                {title}
              </h2>
              <UserCog size={18} className="text-cyan-300" />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
              {role}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {detail}
            </p>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <UsersRound className="text-cyan-300" size={22} />
          <div>
            <h2 className="text-xl font-bold">
              Account Directory
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Structured account list only. Operational delivery context is
              intentionally separated into workflow and tracker pages.
            </p>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Created</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
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

                <td className="p-4">
                  <span
                    className={
                      user.isActive
                        ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                        : "rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="p-4 text-sm text-slate-400">
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(user.createdAt)}
                </td>

                <td className="p-4">
                  <SwitchUserButton userId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

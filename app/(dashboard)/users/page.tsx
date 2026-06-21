import Link from "next/link";
import {
  KeyRound,
  Plus,
  Save,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";

import SwitchUserButton from "@/components/users/switch-user-button";
import { getUsers } from "@/services/users/user.service";
import {
  createUser,
  deactivateUser,
  resetUserPassword,
  updateUser,
} from "./actions";

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
    "PROJECT_MANAGER",
    "Project Manager",
    "Owns assigned SPR delivery context, app-team coordination, retest readiness, and remediation follow-up.",
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
  ["REVIEWER", "Reviewer", "Primary execution role for reviewers and legacy consultant users."],
];

const editableRoles = [
  ["ADMIN", "Admin"],
  ["GOVERNANCE_TEAM", "Governance Team"],
  ["EXECUTIVE", "Executive"],
  ["PROJECT_MANAGER", "Project Manager"],
  ["ENGAGEMENT_MANAGER", "Engagement Manager"],
  ["QA_REVIEWER", "QA Reviewer"],
  ["REVIEWER", "Reviewer"],
];

function cleanRole(role: string) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE TEAM";
  }

  if (role === "DEVELOPER") {
    return "REVIEWER";
  }

  if (role === "VIEWER") {
    return "REVIEWER";
  }

  if (role === "CONSULTANT") {
    return "REVIEWER";
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

      <form
        action={createUser}
        className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Plus className="text-cyan-300" size={22} />
          <div>
            <h2 className="text-xl font-bold text-white">
              Add User
            </h2>
            <p className="text-sm text-slate-400">
              Admin dashboard for creating leadership, governance, engagement,
              QA, and reviewer accounts.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          <input
            name="name"
            placeholder="Full name"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="email@atomix.ai"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            required
          />
          <select
            name="role"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          >
            {editableRoles.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="password"
            type="password"
            placeholder="Optional password"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          />
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
            <Plus size={16} />
            Add User
          </button>
        </div>
      </form>

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
                <td className="p-4 align-top">
                  <form
                    id={`update-${user.id}`}
                    action={updateUser}
                    className="space-y-2"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      name="name"
                      defaultValue={user.name}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                    />
                    <input
                      name="email"
                      type="email"
                      defaultValue={user.email}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300"
                    />
                  </form>
                </td>

                <td className="p-4 align-top">
                  <select
                    form={`update-${user.id}`}
                    name="role"
                    defaultValue={
                      user.role === "CONSULTANT" ||
                      user.role === "DEVELOPER" ||
                      user.role === "VIEWER"
                        ? "REVIEWER"
                        : user.role
                    }
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-cyan-200"
                  >
                    {editableRoles.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    Current: {cleanRole(user.role)}
                  </p>
                </td>

                <td className="p-4 align-top">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input
                      form={`update-${user.id}`}
                      type="checkbox"
                      name="isActive"
                      defaultChecked={user.isActive}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    {user.isActive ? "Active" : "Inactive"}
                  </label>
                </td>

                <td className="p-4 align-top text-sm text-slate-400">
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(user.createdAt)}
                </td>

                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <button
                      form={`update-${user.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/30"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <SwitchUserButton userId={user.id} />
                    <form action={deactivateUser}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </form>
                  </div>

                  <form
                    action={resetUserPassword}
                    className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Admin password reset
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        name="password"
                        type="password"
                        minLength={8}
                        placeholder="New password"
                        className="min-w-48 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                        required
                      />
                      <button className="inline-flex items-center gap-2 rounded-lg bg-amber-400/15 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-400/25">
                        <KeyRound size={14} />
                        Reset
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Admin only. Sets a new password immediately for this
                      account.
                    </p>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

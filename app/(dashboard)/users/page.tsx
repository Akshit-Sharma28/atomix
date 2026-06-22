import Link from "next/link";
import {
  KeyRound,
  Plus,
  Save,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";

import { getUsers } from "@/services/users/user.service";
import {
  createUser,
  deactivateUser,
  resetUserPassword,
  updateUser,
} from "./actions";

const roleDefinitions = [
  ["ADMIN", "Admin", "Full account, RBAC, and platform administration."],
  [
    "GOVERNANCE_TEAM",
    "Governance Team",
    "Owns reviewer allocation, weekly governance calls, tracker health, and SR assignment.",
  ],
  [
    "VALIDATOR",
    "Validator",
    "Coordinates pre-review readiness, demo-call intake, artifacts, and prerequisite checks.",
  ],
  [
    "EXECUTIVE",
    "Executive",
    "Leadership view for delivery health, variance, governance trends, and escalation signals.",
  ],
  [
    "PROJECT_MANAGER",
    "Project Manager",
    "Owns assigned package context, app-team coordination, retest readiness, and follow-up.",
  ],
  [
    "ENGAGEMENT_MANAGER",
    "Engagement Manager",
    "Coordinates review delivery across packages without user administration access.",
  ],
  ["QA_REVIEWER", "QA Reviewer", "Handles peer-review quality gates and evidence checks."],
  ["REVIEWER", "Reviewer", "Executes assigned security review work."],
  ["RETESTER", "Retester", "Handles retest validation and fix-readiness checks."],
];

const editableRoles = roleDefinitions.map(([value, label]) => [value, label]);

function normalizedRoleValue(role: string) {
  if (["CONSULTANT", "DEVELOPER", "VIEWER"].includes(role)) {
    return "REVIEWER";
  }

  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  return role;
}

function cleanRole(role: string) {
  return normalizedRoleValue(role).replaceAll("_", " ");
}

function roleLabel(role: string) {
  const normalized = normalizedRoleValue(role);
  return editableRoles.find(([value]) => value === normalized)?.[1] ?? cleanRole(role);
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            User Administration
          </p>
          <h1 className="mt-3 text-4xl font-bold">Users & RBAC</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Keep identity management clean: list users first, then open a user
            to edit role, name, email, account status, or reset password.
          </p>
        </div>

        <Link
          href="/workflow"
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/15"
        >
          Open Validator Workflow
        </Link>
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

      <form
        action={createUser}
        className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Plus className="text-cyan-300" size={22} />
          <div>
            <h2 className="text-xl font-bold text-white">Add User</h2>
            <p className="text-sm text-slate-400">
              Create a user with the updated governance RBAC model.
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

      <div className="mb-8 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {roleDefinitions.map(([role, title, detail]) => (
          <article
            key={role}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-white">{title}</h2>
              <UserCog size={18} className="text-cyan-300" />
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
              {role}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-400">{detail}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <UsersRound className="text-cyan-300" size={22} />
          <div>
            <h2 className="text-xl font-bold">Account Directory</h2>
            <p className="mt-1 text-sm text-slate-400">
              Click a user to expand edit, status, and password controls.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {users.map((user) => (
            <details key={user.id} className="group p-5 open:bg-slate-950/35">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{user.name}</h3>
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {roleLabel(user.role)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isActive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                </div>

                <div className="text-sm font-semibold text-cyan-200 group-open:hidden">
                  Manage
                </div>
                <div className="hidden text-sm font-semibold text-slate-400 group-open:block">
                  Close
                </div>
              </summary>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                <form
                  id={`update-${user.id}`}
                  action={updateUser}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="font-bold text-white">Edit account</h4>
                    <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/30">
                      <Save size={14} />
                      Save Changes
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm text-slate-400">
                      Name
                      <input
                        name="name"
                        defaultValue={user.name}
                        className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                        required
                      />
                    </label>
                    <label className="text-sm text-slate-400">
                      Email
                      <input
                        name="email"
                        type="email"
                        defaultValue={user.email}
                        className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300"
                        required
                      />
                    </label>
                    <label className="text-sm text-slate-400">
                      Role
                      <select
                        name="role"
                        defaultValue={normalizedRoleValue(user.role)}
                        className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-cyan-200"
                      >
                        {editableRoles.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-8 inline-flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={user.isActive}
                        className="h-4 w-4 accent-cyan-400"
                      />
                      Active account
                    </label>
                  </div>
                </form>

                <div className="space-y-4">
                  <form
                    action={resetUserPassword}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <label className="block text-sm font-semibold text-white">
                      Reset password
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                      Admin only. Sets a new password immediately for this account.
                    </p>
                  </form>

                  <form
                    action={deactivateUser}
                    className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <h4 className="font-bold text-red-100">Deactivate user</h4>
                    <p className="mt-2 text-sm text-red-200/70">
                      Keeps the user record for audit, but removes active access.
                    </p>
                    <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20">
                      <Trash2 size={14} />
                      Deactivate
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

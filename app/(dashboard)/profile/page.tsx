import {
  BadgeCheck,
  Bot,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getCurrentUser } from "@/services/users/current-user.service";
import { normalizeRole } from "@/services/users/access.service";

function cleanRole(role?: string | null) {
  return normalizeRole(role).replaceAll("_", " ");
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const fallbackUser = await getCurrentUser();
  const sessionUser = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        role?: string | null;
      }
    | undefined;

  const name = sessionUser?.name ?? fallbackUser?.name ?? "Atomix User";
  const email = sessionUser?.email ?? fallbackUser?.email ?? "No email";
  const role = cleanRole(sessionUser?.role ?? fallbackUser?.role);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
          User Profile
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white">
          Profile & Access
        </h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          Your active Atomix identity, access layer, and agentic capability
          context.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6 lg:col-span-1">
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-cyan-400 text-3xl font-black text-slate-950">
            {initials || "A"}
          </div>
          <h2 className="mt-5 text-2xl font-bold text-white">
            {name}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <Mail size={15} />
            {email}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200">
            <Shield size={15} />
            {role}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <BadgeCheck className="text-cyan-300" size={24} />
            <h2 className="text-xl font-bold text-white">
              Access Summary
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Identity Layer",
                "Authenticated account used for session and role visibility.",
                UserRound,
              ],
              [
                "Role Layer",
                `${role} access determines sidebar visibility and workflow boundaries.`,
                Shield,
              ],
              [
                "Agentic Layer",
                "Copilot prompts can be launched from Executive, Workflow, and Pentester Tracker pages.",
                Bot,
              ],
              [
                "Administration",
                "Admins can create, modify, deactivate, and switch demo users from Users.",
                BadgeCheck,
              ],
            ].map(([title, detail, Icon]) => {
              const ProfileIcon = Icon as typeof UserRound;

              return (
                <div
                  key={title as string}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <ProfileIcon className="text-cyan-300" size={22} />
                  <h3 className="mt-3 font-bold text-white">
                    {title as string}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {detail as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

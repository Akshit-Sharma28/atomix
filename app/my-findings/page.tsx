import Link from "next/link";

import { prisma } from "../../lib/prisma";

import {
  getCurrentUser,
} from "../../services/users/current-user.service";

import {
  ShieldAlert,
  User,
} from "lucide-react";

export default async function MyFindingsPage() {
  const currentUser =
    await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="p-8">
        User not found
      </div>
    );
  }

  const findings =
    await prisma.finding.findMany({
      where: {
        ownerId: currentUser.id,
      },
      include: {
        project: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

  return (
    <div className="max-w-7xl mx-auto p-8">

      <div className="mb-8">

        <div className="flex items-center gap-4">

          <User
            size={40}
            className="text-cyan-400"
          />

          <div>

            <h1 className="text-5xl font-bold">
              My Findings
            </h1>

            <p className="text-slate-400 mt-2">
              Findings assigned to
              {" "}
              {currentUser.name}
            </p>

          </div>

        </div>

      </div>

      <div className="mb-6">

        <p className="text-slate-400">
          {findings.length}
          {" "}
          assigned findings
        </p>

      </div>

      <div className="space-y-4">

        {findings.map((finding) => (
          <Link
            key={finding.id}
            href={`/findings/${finding.id}`}
            className="
            block
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            hover:border-cyan-500
            transition-all
            "
          >
            <div className="flex justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  {finding.title}
                </h2>

                <p className="text-slate-400 mt-2">
                  {finding.project.name}
                </p>

              </div>

              <div className="text-right">

                <div
                  className="
                  bg-cyan-500/10
                  text-cyan-400
                  px-3
                  py-1
                  rounded-full
                  "
                >
                  {finding.severity}
                </div>

                <p className="mt-2 text-slate-400">
                  {finding.status}
                </p>

              </div>

            </div>

            {finding.dueDate && (
              <p className="mt-4 text-orange-400">
                Due:
                {" "}
                {new Date(
                  finding.dueDate
                ).toLocaleDateString()}
              </p>
            )}
          </Link>
        ))}

        {findings.length === 0 && (
          <div
            className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-12
            text-center
            "
          >
            <ShieldAlert
              size={48}
              className="
              mx-auto
              mb-4
              text-slate-600
              "
            />

            <p className="text-slate-400">
              No findings assigned
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
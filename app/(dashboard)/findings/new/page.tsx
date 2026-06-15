import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Brain } from "lucide-react";
import { createFinding } from "@/app/actions/findings";

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-2">
      {children}

      <svg
        className="
        absolute
        right-5
        top-1/2
        -translate-y-1/2
        w-4
        h-4
        text-slate-400
        pointer-events-none
        "
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

export default async function NewFindingPage() {
  const projects = await prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["CONSULTANT", "REVIEWER", "QA_REVIEWER"],
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div
      className="
      w-full
      px-8
      py-6
      "
    >
      {/* Header */}

      <div
        className="
        mb-6
        pb-5
        border-b
        border-slate-800
        "
      >
        <div className="mb-2 text-sm text-slate-500">
          Findings / New Finding
        </div>

        <h1
          className="
          text-3xl
          font-bold
          text-white
          "
        >
          New Finding
        </h1>

        <p className="text-slate-400 mt-2">
          Create and assign a new security finding.
        </p>
      </div>

      <form action={createFinding}className="space-y-6">
        {/* Top Grid */}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Finding Information */}

          <div
            className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            space-y-5
            "
          >
            <h2 className="font-semibold text-lg">Finding Information</h2>

            <div>
              <label className="text-sm text-slate-400">Title</label>

              <input
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                outline-none
                focus:border-cyan-500/50
                "
                placeholder="SQL Injection in Search Endpoint"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Project</label>

              <SelectWrapper>
                <select
                  className="
                    w-full
                    rounded-xl
                    bg-slate-950
                    border
                    border-slate-800
                    px-4
                    pr-12
                    py-3
                    appearance-none
                    outline-none
                    "
                >
                  <option value="">Select Project</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className="text-sm text-slate-400">Severity</label>

              <SelectWrapper>
                <select
                  className="
                    w-full
                    rounded-xl
                    bg-slate-950
                    border
                    border-slate-800
                    px-4
                    pr-12
                    py-3
                    appearance-none
                    outline-none
                    "
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </SelectWrapper>

              <div className="mt-3">
                <span
                  className="
                  px-3
                  py-1
                  rounded-full
                  bg-red-500/20
                  text-red-400
                  text-xs
                  font-medium
                  "
                >
                  Critical
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Source</label>

              <input
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                outline-none
            focus:border-cyan-500/50
                "
                placeholder="Manual Pentest"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Owner</label>

              <SelectWrapper>
                <select
                    className="
                    w-full
                    rounded-xl
                    bg-slate-950
                    border
                    border-slate-800
                    px-4
                    pr-12
                    py-3
                    appearance-none
                    outline-none
                    "
                    >
                    <option>
                        Unassigned
                    </option>

    {users.map((user) => (
      <option
        key={user.id}
      >
        {user.name}
      </option>
    ))}
  </select>
</SelectWrapper>
            </div>
          </div>

          {/* Risk Information */}

          <div
            className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            space-y-5
            "
          >
            <h2 className="font-semibold text-lg">Risk Information</h2>

            <div>
              <label className="text-sm text-slate-400">CVSS Score</label>

              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="9.8"
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                "
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">CVSS Vector</label>

              <input
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                "
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">CWE</label>

              <input
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                "
                placeholder="CWE-89"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">OWASP Category</label>

              <input
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                "
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Due Date</label>

              <input
                type="date"
                className="
                mt-2
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                "
              />
            </div>
          </div>
        </div>

        {/* AI Review */}

        <div
          className="
         bg-cyan-500/5
        border
        border-cyan-500/20
        hover:border-cyan-400/40
        hover:bg-cyan-500/10
        transition-all
        cursor-pointer
          rounded-2xl
          p-6
          "
        >
          <div className="flex items-center gap-4">
            <div
              className="
              w-12
              h-12
              rounded-xl
              bg-cyan-500/10
              flex
              items-center
              justify-center
              "
            >
              <Brain size={22} className="text-cyan-400" />
            </div>

            <div>
              <h3 className="font-semibold text-cyan-400">Atomix AI Review</h3>

              <p className="text-slate-400 text-sm">
                Generate enriched vulnerability analysis using local AI.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-5">
            <div className="bg-slate-900 rounded-xl p-4">
              <p className="font-medium">Risk Score</p>

              <p className="text-slate-400 text-sm mt-1">
                AI risk validation and prioritization.
              </p>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <p className="font-medium">Executive Summary</p>

              <p className="text-slate-400 text-sm mt-1">
                Business-focused impact explanation.
              </p>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <p className="font-medium">Developer Guidance</p>

              <p className="text-slate-400 text-sm mt-1">
                Secure coding recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Description */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <label className="text-sm text-slate-400">Description</label>

          <textarea
            rows={10}
            className="
                mt-3
                w-full
                rounded-xl
                bg-slate-950
                border
                border-slate-800
                px-4
                py-3
                resize-y
                min-h-[220px]
                outline-none
                focus:border-cyan-500/50
                "
          />
        </div>

        {/* Remediation */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <label className="text-sm text-slate-400">Remediation</label>

          <textarea
            rows={10}
            className="
            mt-3
            w-full
            rounded-xl
            bg-slate-950
            border
            border-slate-800
            px-4
            py-3
            "
          />
        </div>

        {/* Actions */}

        <div className="flex gap-3">
          <button
            type="button"
            className="
            px-6
            py-3
            rounded-xl
           bg-slate-800
            hover:bg-slate-700
            border
            border-slate-800
            hover:border-cyan-500/30
            transition-all
            "
          >
            Save Finding
          </button>

          <button
            type="submit"
            className="
            px-6
            py-3
            rounded-xl
            bg-cyan-500
            text-black
            font-semibold
            hover:bg-cyan-400
            transition-all
            "
          >
            Save & AI Review
          </button>

          <Link
            href="/findings"
            className="
            px-6
            py-3
            rounded-xl
            bg-slate-900
            border
            border-slate-800
            "
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BriefcaseBusiness, UserRoundCheck } from "lucide-react";

import { createInterviewProfile } from "@/app/(dashboard)/workflow/interview-agent/actions";

type UserOption = {
  id: string;
  name: string;
};

type Props = {
  users: UserOption[];
  sources: string[];
  priorities: string[];
};

const fieldClass =
  "rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500";

export default function InterviewProfileCreateForm({
  users,
  sources,
  priorities,
}: Props) {
  const [interviewKind, setInterviewKind] =
    useState<"External" | "Internal">("External");

  const isInternal =
    interviewKind === "Internal";

  return (
    <section className="mb-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Interview Governance Intake
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">
            Create one governed interview profile
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Choose candidate type first. Internal profiles capture Employee ID,
            team, and project; external profiles capture resume/source details.
            Interviewers are assigned later when scheduling rounds.
          </p>
        </div>
        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200">
          AI scoring disabled by default
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setInterviewKind("External")}
          className={`rounded-2xl border p-4 text-left transition ${
            !isInternal
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-slate-800 bg-slate-950/70 hover:border-cyan-400/40"
          }`}
        >
          <UserRoundCheck className="mb-3 text-cyan-300" size={22} />
          <p className="font-bold text-white">Interview Candidate</p>
          <p className="mt-1 text-sm text-slate-400">
            External candidate. No Employee ID required.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setInterviewKind("Internal")}
          className={`rounded-2xl border p-4 text-left transition ${
            isInternal
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-slate-800 bg-slate-950/70 hover:border-cyan-400/40"
          }`}
        >
          <BriefcaseBusiness className="mb-3 text-cyan-300" size={22} />
          <p className="font-bold text-white">Internal Employee Candidate</p>
          <p className="mt-1 text-sm text-slate-400">
            Employee nomination. Employee ID/team/project are captured here.
          </p>
        </button>
      </div>

      <form action={createInterviewProfile} className="grid gap-3 xl:grid-cols-4">
        <input type="hidden" name="interviewKind" value={interviewKind} />
        <input
          name="name"
          required
          placeholder={isInternal ? "Employee name" : "Candidate name"}
          className={fieldClass}
        />
        <input
          name="currentRole"
          placeholder={isInternal ? "Current role / target role" : "Target role"}
          className={fieldClass}
        />
        <input
          name="experience"
          placeholder="Experience"
          className={fieldClass}
        />
        <input
          name="skills"
          placeholder="Skills"
          className={fieldClass}
        />

        {isInternal ? (
          <>
            <input
              name="employeeId"
              placeholder="Employee ID"
              className={fieldClass}
            />
            <input
              name="currentTeam"
              placeholder="Current team"
              className={fieldClass}
            />
            <input
              name="currentProject"
              placeholder="Current project"
              className={fieldClass}
            />
          </>
        ) : (
          <>
            <input
              name="resumeFileName"
              placeholder="Resume file name"
              className={fieldClass}
            />
            <input
              name="linkedIn"
              placeholder="LinkedIn URL"
              className={fieldClass}
            />
            <select name="source" className={fieldClass}>
              <option value="">Source</option>
              {sources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </>
        )}

        <input
          name="certifications"
          placeholder="Certifications"
          className={fieldClass}
        />
        <select name="assignedRecruiterId" className={fieldClass}>
          <option value="">Assigned recruiter / coordinator</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select name="hiringManagerId" className={fieldClass}>
          <option value="">Hiring manager</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue="Medium" className={fieldClass}>
          {priorities.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
        <input
          name="tags"
          placeholder="Tags"
          className={fieldClass}
        />
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400 xl:col-span-3">
          <span className="font-semibold text-cyan-200">Interviewer roles:</span>{" "}
          assign Primary Interviewer, Secondary Interviewer, and Observer in the
          Schedule Interview step after profile creation.
        </div>
        <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">
          Create profile
        </button>
      </form>
    </section>
  );
}

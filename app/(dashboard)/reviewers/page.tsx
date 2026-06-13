import { prisma } from "@/lib/prisma";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

function availabilityClass(availability: string) {
  if (availability === "Available") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (["Unavailable", "On Leave"].includes(availability)) {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }

  return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
}

export default async function ReviewersPage() {
  const [reviewers, users, unassignedReviews] = await Promise.all([
    prisma.reviewerProfile.findMany({
      include: {
        user: true,
        skills: true,
        assignments: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
            workstream: true,
          },
          where: {
            status: {
              in: ["Assigned", "Accepted", "In Progress"],
            },
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        reviewAssignments: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
            workstream: true,
          },
          where: {
            status: {
              in: ["Assigned", "Accepted", "In Progress"],
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.securityReview.count({
      where: {
        assignments: {
          none: {},
        },
        status: {
          notIn: ["Completed", "Cancelled"],
        },
      },
    }),
  ]);

  const reviewerRows =
    reviewers.length > 0
      ? reviewers.map((reviewer) => ({
          id: reviewer.id,
          name: reviewer.user.name,
          email: reviewer.user.email,
          availability: reviewer.availability,
          capacity: reviewer.weeklyCapacityHours,
          skills: reviewer.skills.map((skill) => skill.skill),
          assignments: reviewer.assignments,
        }))
      : users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          availability: "Profile Needed",
          capacity: 0,
          skills: [user.role],
          assignments: user.reviewAssignments,
        }));

  const totalCapacity = reviewerRows.reduce(
    (sum, reviewer) => sum + reviewer.capacity,
    0,
  );

  const allocatedHours = reviewerRows.reduce(
    (sum, reviewer) =>
      sum +
      reviewer.assignments.reduce(
        (assignmentSum, assignment) =>
          assignmentSum + (assignment.allocatedHours ?? 0),
        0,
      ),
    0,
  );

  const availableReviewers = reviewerRows.filter(
    (reviewer) => reviewer.availability === "Available",
  ).length;

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 pb-5 border-b border-slate-800">
        <div className="mb-2 text-sm text-slate-500">Pentester Tracker</div>

        <h1 className="text-3xl font-bold text-white">
          Reviewer Capacity & Assignments
        </h1>

        <p className="text-slate-400 mt-2 max-w-3xl">
          See which pentesters are available, what SRs they are working on,
          where reviews need staffing, and where extension pressure is building.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Available</span>
            <UserCheck size={20} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-emerald-300">
            {availableReviewers}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Capacity hrs/wk</span>
            <CalendarDays size={20} className="text-cyan-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-cyan-300">
            {totalCapacity}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Allocated hrs</span>
            <Activity size={20} className="text-purple-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-purple-300">
            {allocatedHours}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Unassigned SRs</span>
            <AlertTriangle size={20} className="text-yellow-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-yellow-300">
            {unassignedReviews}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Pentester Workload</h2>
          <p className="text-sm text-slate-400">
            Profiles use reviewer capacity when present, otherwise active users
            are shown as needing profile setup.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {reviewerRows.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              No active users or reviewer profiles found.
            </div>
          )}

          {reviewerRows.map((reviewer) => {
            const assignedHours = reviewer.assignments.reduce(
              (sum, assignment) => sum + (assignment.allocatedHours ?? 0),
              0,
            );
            const remainingHours = reviewer.capacity - assignedHours;

            return (
              <div key={reviewer.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {reviewer.name}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${availabilityClass(
                          reviewer.availability,
                        )}`}
                      >
                        {reviewer.availability}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {reviewer.email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewer.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-950 px-4 py-3">
                      <div className="text-xs text-slate-500">Capacity</div>
                      <div className="text-lg font-bold text-cyan-300">
                        {reviewer.capacity}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 px-4 py-3">
                      <div className="text-xs text-slate-500">Allocated</div>
                      <div className="text-lg font-bold text-purple-300">
                        {assignedHours}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 px-4 py-3">
                      <div className="text-xs text-slate-500">Remaining</div>
                      <div
                        className={
                          remainingHours < 0
                            ? "text-lg font-bold text-red-300"
                            : "text-lg font-bold text-emerald-300"
                        }
                      >
                        {remainingHours}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {reviewer.assignments.length === 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
                      No active SR assignments.
                    </div>
                  )}

                  {reviewer.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">
                            {assignment.review.srId ?? assignment.review.title}
                          </div>
                          <div className="text-sm text-slate-500">
                            {assignment.review.project.name}
                            {assignment.workstream
                              ? ` • ${assignment.workstream.type}`
                              : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300">
                            {assignment.role}
                          </span>
                          <span className="text-slate-400">
                            {assignment.allocatedHours ?? 0}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="mt-0.5 text-emerald-300" />
          <p className="text-sm text-slate-400">
            This is the manager view for deciding who can take a frontend,
            backend, API, MSB, or LLM review next — and which SRs need
            assignment, extension, or cancellation attention.
          </p>
        </div>
      </div>
    </div>
  );
}

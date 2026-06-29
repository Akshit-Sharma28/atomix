import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Filter,
  History,
  Search,
  UserPlus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { canAccess } from "@/services/users/access.service";
import {
  createInterviewProfile,
  saveCapabilityRating,
  saveInterviewFeedback,
  scheduleInterviewRound,
  updateInterviewAction,
  updateInterviewProfile,
} from "./actions";

const workflowStages = [
  "Applied / Nominated",
  "Resume Screening",
  "Shortlisted",
  "Mock Interview Scheduled",
  "Mock Interview Completed",
  "GIS Interview Scheduled",
  "GIS Interview Completed",
  "Technical Interview",
  "Manager Discussion",
  "Final Decision",
  "Selected",
  "Rejected",
  "On Hold",
  "Future Consideration",
];

const interviewCategories = [
  "Mock Interview",
  "GIS Interview",
  "Technical Interview",
  "Manager Discussion",
  "LLM Security Interview",
  "API Security Interview",
  "Web Application Security",
  "Cloud Security",
  "AI Security",
  "Custom Interview",
];

const technologies = [
  "Web Pentesting",
  "API Security",
  "Mobile Security",
  "Cloud Security",
  "Azure",
  "AWS",
  "Burp Suite",
  "Python",
  "JavaScript",
  "AI Security",
  "LLM Security",
  "MCP Security",
  "GraphQL",
  "Authentication",
  "Authorization",
];

const ratings = ["Beginner", "Intermediate", "Advanced", "Expert"];
const recommendations = ["Strong Hire", "Hire", "Borderline", "Needs Upskilling", "Reject"];
const priorities = ["Low", "Medium", "High", "Critical"];
const sources = ["Referral", "Portal", "Agency", "Campus", "Direct Application"];

function includes(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function formatDate(date?: Date | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date?: Date | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function average(values: number[]) {
  const filtered = values.filter((value) => value > 0);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function daysBetween(start?: Date | null, end?: Date | null) {
  if (!start || !end) return null;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
}

function statusClass(status: string) {
  if (["Selected", "Completed", "Closed"].includes(status)) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (["Rejected", "Overdue"].includes(status)) return "border-red-500/30 bg-red-500/10 text-red-200";
  if (["On Hold", "Future Consideration", "Needs Upskilling"].includes(status)) return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
}

export default async function InterviewAgentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    kind?: string;
    status?: string;
    category?: string;
    recommendation?: string;
    skill?: string;
    interviewer?: string;
  }>;
}) {
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "ENGAGEMENT_MANAGER",
    "PROJECT_MANAGER",
    "VALIDATOR",
    "QA_REVIEWER",
    "REVIEWER",
    "RETESTER",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">Interview Agent access restricted</h1>
          <p className="mt-2 text-slate-400">Interview governance is available to governance, recruitment coordinators, project managers, interviewers, and leadership roles.</p>
        </div>
      </div>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const kind = params.kind ?? "All";
  const status = params.status ?? "All";
  const category = params.category ?? "All";
  const recommendation = params.recommendation ?? "All";
  const skill = params.skill ?? "All";
  const interviewer = params.interviewer ?? "All";
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const [profiles, users] = await Promise.all([
    prisma.interviewProfile.findMany({
      include: {
        assignedRecruiter: true,
        hiringManager: true,
        rounds: {
          include: {
            owner: true,
            primaryInterviewer: true,
            secondaryInterviewer: true,
            observer: true,
            feedback: true,
          },
          orderBy: {
            scheduledAt: "desc",
          },
        },
        capabilities: {
          orderBy: {
            technology: "asc",
          },
        },
        actions: {
          include: {
            owner: true,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
        audits: {
          orderBy: {
            createdAt: "desc",
          },
          take: 8,
        },
      },
      orderBy: {
        updatedAt: "desc",
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
  ]);

  const filteredProfiles = profiles.filter((profile) => {
    const latestFeedback = profile.rounds.find((round) => round.feedback)?.feedback;
    const profileText = [
      profile.name,
      profile.candidateCode,
      profile.currentRole,
      profile.currentTeam,
      profile.skills,
      profile.certifications,
      profile.tags,
      profile.assignedRecruiter?.name,
      profile.hiringManager?.name,
      ...profile.rounds.map((round) => `${round.category} ${round.primaryInterviewer?.name ?? ""} ${round.secondaryInterviewer?.name ?? ""}`),
      ...profile.capabilities.map((capability) => `${capability.technology} ${capability.rating}`),
    ].join(" ");

    const queryMatch = !query || includes(profileText, query);
    const kindMatch = kind === "All" || profile.interviewKind === kind;
    const statusMatch = status === "All" || profile.status === status;
    const categoryMatch = category === "All" || profile.rounds.some((round) => round.category === category);
    const recommendationMatch = recommendation === "All" || latestFeedback?.finalRecommendation === recommendation;
    const skillMatch = skill === "All" || includes(profile.skills, skill) || profile.capabilities.some((capability) => capability.technology === skill);
    const interviewerMatch = interviewer === "All" || profile.rounds.some((round) => [round.primaryInterviewer?.name, round.secondaryInterviewer?.name, round.observer?.name].includes(interviewer));

    return queryMatch && kindMatch && statusMatch && categoryMatch && recommendationMatch && skillMatch && interviewerMatch;
  });

  const allRounds = profiles.flatMap((profile) => profile.rounds.map((round) => ({ ...round, profile })));
  const filteredRounds = filteredProfiles.flatMap((profile) => profile.rounds.map((round) => ({ ...round, profile })));
  const feedbacks = allRounds.map((round) => round.feedback).filter(Boolean);
  const pendingFeedback = allRounds.filter((round) => round.status !== "Completed" && round.scheduledAt && round.scheduledAt < today).length;
  const interviewsToday = allRounds.filter((round) => round.scheduledAt?.toISOString().slice(0, 10) === todayKey).length;
  const completedRounds = allRounds.filter((round) => round.status === "Completed").length;
  const avgTechnical = average(feedbacks.map((feedback) => feedback?.technicalKnowledge ?? 0));
  const avgCommunication = average(feedbacks.map((feedback) => feedback?.communication ?? 0));
  const completionPct = allRounds.length === 0 ? 0 : Math.round((completedRounds / allRounds.length) * 100);
  const selected = profiles.filter((profile) => profile.status === "Selected").length;
  const rejected = profiles.filter((profile) => profile.status === "Rejected").length;
  const onHold = profiles.filter((profile) => profile.status === "On Hold").length;
  const mockTotal = allRounds.filter((round) => round.category === "Mock Interview").length;
  const mockDone = allRounds.filter((round) => round.category === "Mock Interview" && round.status === "Completed").length;
  const gisTotal = allRounds.filter((round) => round.category === "GIS Interview").length;
  const gisDone = allRounds.filter((round) => round.category === "GIS Interview" && round.status === "Completed").length;
  const averageDuration = average(allRounds.map((round) => round.durationMinutes ?? daysBetween(round.scheduledAt, round.completedAt) ?? 0));

  const activeActions = profiles.flatMap((profile) =>
    profile.actions
      .filter((action) => action.status !== "Closed")
      .map((action) => ({ ...action, profile })),
  );
  const calendarRounds = filteredRounds
    .filter((round) => round.scheduledAt)
    .sort((first, second) => (first.scheduledAt?.getTime() ?? 0) - (second.scheduledAt?.getTime() ?? 0))
    .slice(0, 12);
  const conflictKeys = new Map<string, number>();
  allRounds.forEach((round) => {
    if (!round.scheduledAt || !round.primaryInterviewerId) return;
    const key = `${round.primaryInterviewerId}-${round.scheduledAt.toISOString().slice(0, 13)}`;
    conflictKeys.set(key, (conflictKeys.get(key) ?? 0) + 1);
  });

  const csvRows = [
    ["ID", "Name", "Kind", "Status", "Priority", "Recruiter", "Hiring Manager", "Skills", "Recommendation"],
    ...filteredProfiles.map((profile) => [
      profile.candidateCode,
      profile.name,
      profile.interviewKind,
      profile.status,
      profile.priority,
      profile.assignedRecruiter?.name ?? "",
      profile.hiringManager?.name ?? "",
      profile.skills ?? "",
      profile.rounds.find((round) => round.feedback)?.feedback?.finalRecommendation ?? "",
    ]),
  ];
  const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const reportText = `Recruitment & Interview Governance Summary\n\nTotal Candidates: ${profiles.length}\nInternal: ${profiles.filter((profile) => profile.interviewKind === "Internal").length}\nExternal: ${profiles.filter((profile) => profile.interviewKind === "External").length}\nInterviews Today: ${interviewsToday}\nPending Feedback: ${pendingFeedback}\nSelected: ${selected}\nRejected: ${rejected}\nOn Hold: ${onHold}\nAverage Technical Rating: ${avgTechnical.toFixed(1)} / 5\nAverage Communication Rating: ${avgCommunication.toFixed(1)} / 5\nInterview Completion: ${completionPct}%\nMock Completion: ${mockTotal ? Math.round((mockDone / mockTotal) * 100) : 0}%\nGIS Completion: ${gisTotal ? Math.round((gisDone / gisTotal) * 100) : 0}%\nAverage Interview Duration: ${Math.round(averageDuration)} minutes`;

  return (
    <div className="w-full overflow-hidden px-6 py-6 lg:px-8">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <UserPlus size={16} />
          Recruitment Governance / Interview Agent
        </div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Interview Agent</h1>
            <p className="mt-2 max-w-4xl text-slate-400">Replace Excel-based mock/GIS/interview tracking with governed profiles, workflow stages, assignments, feedback, capability matrix, audit history, reminders, and reporting. AI hooks are modular and disabled by default.</p>
          </div>
          <Link href={`/copilot?prompt=${encodeURIComponent("Act as Atomix Interview Governance Agent. Summarize recruitment workflow, pending feedback, overdue interviews, capability gaps, hiring funnel, and governance actions. Do not use sensitive HR/payroll data.")}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">
            <Bot size={16} /> Ask Interview Agent
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Candidates", profiles.length, "tracked profiles"],
          ["Internal Interviews", profiles.filter((profile) => profile.interviewKind === "Internal").length, "employee nominations"],
          ["External Interviews", profiles.filter((profile) => profile.interviewKind === "External").length, "candidate pipeline"],
          ["Interviews Today", interviewsToday, "scheduled sessions"],
          ["Pending Feedback", pendingFeedback, "SLA attention"],
          ["Selected", selected, "positive decisions"],
          ["Rejected", rejected, "closed rejected"],
          ["On Hold", onHold, "paused decisions"],
          ["Avg Technical", avgTechnical.toFixed(1), "rating / 5"],
          ["Completion", `${completionPct}%`, "interview rounds"],
        ].map(([label, value, helper]) => (
          <div key={label as string} className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label as string}</p>
            <p className="mt-3 text-3xl font-black text-white">{value as string | number}</p>
            <p className="mt-2 text-xs text-slate-400">{helper as string}</p>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Interview Type Toggle</p>
            <h2 className="mt-2 text-xl font-bold text-white">Create candidate / employee profile</h2>
            <p className="mt-1 text-sm text-slate-400">Sensitive HR/payroll fields are intentionally excluded from this module.</p>
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200">AI interview scoring: disabled by default</div>
        </div>
        <form action={createInterviewProfile} className="grid gap-3 xl:grid-cols-4">
          <select name="interviewKind" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
            <option>External</option>
            <option>Internal</option>
          </select>
          <input name="name" required placeholder="Candidate / employee name" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="employeeId" placeholder="Employee ID (internal optional)" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="currentTeam" placeholder="Current team (internal)" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="currentRole" placeholder="Current role" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="experience" placeholder="Experience" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="skills" placeholder="Skills" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="certifications" placeholder="Certifications" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="currentProject" placeholder="Current project (internal)" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="resumeFileName" placeholder="Resume file name (external)" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <input name="linkedIn" placeholder="LinkedIn URL (optional)" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <select name="source" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
            <option value="">Source</option>
            {sources.map((source) => <option key={source}>{source}</option>)}
          </select>
          <select name="assignedRecruiterId" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
            <option value="">Assigned recruiter / coordinator</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          <select name="hiringManagerId" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
            <option value="">Hiring manager</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          <select name="priority" defaultValue="Medium" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
            {priorities.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
          <input name="tags" placeholder="Tags" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
          <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 xl:col-span-4">Create governed interview profile</button>
        </form>
      </section>

      <form action="/workflow/interview-agent" className="mb-6 grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 xl:grid-cols-[1.3fr_repeat(6,0.72fr)_auto]">
        <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <Search className="text-slate-500" size={18} />
          <input name="q" defaultValue={query} placeholder="Search name, skill, interviewer, technology..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <select name="kind" defaultValue={kind} className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option>All</option><option>Internal</option><option>External</option></select>
        <select name="status" defaultValue={status} className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option>All</option>{workflowStages.map((item) => <option key={item}>{item}</option>)}</select>
        <select name="category" defaultValue={category} className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option>All</option>{interviewCategories.map((item) => <option key={item}>{item}</option>)}</select>
        <select name="skill" defaultValue={skill} className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option>All</option>{technologies.map((item) => <option key={item}>{item}</option>)}</select>
        <select name="interviewer" defaultValue={interviewer} className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option>All</option>{users.map((user) => <option key={user.id}>{user.name}</option>)}</select>
        <select name="recommendation" defaultValue={recommendation} className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"><option>All</option>{recommendations.map((item) => <option key={item}>{item}</option>)}</select>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"><Filter size={16} />Filter</button>
      </form>

      <div className="mb-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center gap-3">
            <ClipboardList className="text-cyan-300" size={22} />
            <div>
              <h2 className="text-xl font-bold text-white">Interview Lifecycle</h2>
              <p className="text-sm text-slate-400">Editable workflow, assignments, feedback, capabilities, actions, and audit history.</p>
            </div>
          </div>
          <div className="space-y-4">
            {filteredProfiles.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center text-slate-500">No interview profiles match the current filters.</div>}
            {filteredProfiles.map((profile) => {
              const latestRound = profile.rounds[0];
              const latestFeedback = profile.rounds.find((round) => round.feedback)?.feedback;
              return (
                <article key={profile.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{profile.candidateCode}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(profile.status)}`}>{profile.status}</span>
                        <Link
                          href={`/workflow/interview-agent/${profile.id}`}
                          className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200 hover:border-cyan-300"
                        >
                          Open dashboard
                        </Link>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{profile.interviewKind} · {profile.experience ?? "Experience TBD"} · {profile.currentRole ?? "Role TBD"}</p>
                      <p className="mt-1 text-sm text-slate-500">Skills: {profile.skills || "Not captured"}</p>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <p>Recruiter: {profile.assignedRecruiter?.name ?? "Unassigned"}</p>
                      <p>Hiring manager: {profile.hiringManager?.name ?? "Unassigned"}</p>
                      <p className="text-cyan-200">Priority: {profile.priority}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 2xl:grid-cols-2">
                    <form action={updateInterviewProfile} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <input type="hidden" name="profileId" value={profile.id} />
                      <p className="mb-3 text-sm font-bold text-white">Edit governance details</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <select name="status" defaultValue={profile.status} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{workflowStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
                        <select name="priority" defaultValue={profile.priority} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
                        <input name="currentRole" defaultValue={profile.currentRole ?? ""} placeholder="Current role" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input name="skills" defaultValue={profile.skills ?? ""} placeholder="Skills" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input name="certifications" defaultValue={profile.certifications ?? ""} placeholder="Certifications" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input name="tags" defaultValue={profile.tags ?? ""} placeholder="Tags" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <select name="assignedRecruiterId" defaultValue={profile.assignedRecruiterId ?? ""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Recruiter</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
                        <select name="hiringManagerId" defaultValue={profile.hiringManagerId ?? ""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Hiring manager</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
                      </div>
                      <button className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Save profile</button>
                    </form>

                    <form action={scheduleInterviewRound} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <input type="hidden" name="profileId" value={profile.id} />
                      <p className="mb-3 text-sm font-bold text-white">Schedule interview</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <select name="category" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{interviewCategories.map((item) => <option key={item}>{item}</option>)}</select>
                        <select name="stage" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{workflowStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
                        <select name="primaryInterviewerId" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Primary interviewer</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
                        <select name="secondaryInterviewerId" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Secondary interviewer</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
                        <select name="observerId" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Observer</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
                        <input name="scheduledAt" type="datetime-local" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input name="durationMinutes" type="number" min="15" defaultValue="60" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input name="meetingLink" placeholder="Meeting link" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                      </div>
                      <input name="comments" placeholder="Scheduling comments / attachments reference" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                      <button className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Schedule round</button>
                    </form>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="mb-3 text-sm font-bold text-white">Latest round</p>
                      {latestRound ? (
                        <div className="text-sm leading-6 text-slate-300">
                          <p className="font-semibold text-cyan-200">{latestRound.category}</p>
                          <p>{latestRound.stage} · {latestRound.status}</p>
                          <p>{formatDateTime(latestRound.scheduledAt)}</p>
                          <p>Primary: {latestRound.primaryInterviewer?.name ?? "Unassigned"}</p>
                          {latestFeedback && <p className="mt-2 text-emerald-200">Recommendation: {latestFeedback.finalRecommendation}</p>}
                        </div>
                      ) : <p className="text-sm text-slate-500">No rounds scheduled yet.</p>}
                    </div>

                    <form action={saveCapabilityRating} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <input type="hidden" name="profileId" value={profile.id} />
                      <p className="mb-3 text-sm font-bold text-white">Capability matrix</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select name="technology" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{technologies.map((item) => <option key={item}>{item}</option>)}</select>
                        <select name="rating" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select>
                      </div>
                      <button className="mt-3 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-bold text-cyan-200">Save capability</button>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {profile.capabilities.slice(0, 6).map((capability) => <span key={capability.id} className="rounded-full bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-200">{capability.technology}: {capability.rating}</span>)}
                      </div>
                    </form>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="mb-3 text-sm font-bold text-white">Audit history</p>
                      <div className="space-y-2">
                        {profile.audits.length === 0 ? <p className="text-sm text-slate-500">No edits logged yet.</p> : profile.audits.map((audit) => (
                          <div key={audit.id} className="text-xs leading-5 text-slate-400">
                            <p className="text-slate-200">{audit.action} · {audit.fieldChanged ?? "record"}</p>
                            <p>{audit.user ?? "System"} · {formatDateTime(audit.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {latestRound && (
                    <form action={saveInterviewFeedback} className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                      <input type="hidden" name="roundId" value={latestRound.id} />
                      <p className="mb-3 text-sm font-bold text-white">Structured feedback</p>
                      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
                        {[
                          ["technicalKnowledge", "Technical"],
                          ["communication", "Communication"],
                          ["problemSolving", "Problem solving"],
                          ["securityFundamentals", "Security fundamentals"],
                          ["webApplicationSecurity", "Web app sec"],
                          ["apiSecurity", "API security"],
                          ["burpSuite", "Burp Suite"],
                          ["owasp", "OWASP"],
                          ["cloudSecurity", "Cloud"],
                          ["aiLlmSecurity", "AI / LLM"],
                          ["documentation", "Documentation"],
                          ["overallConfidence", "Confidence"],
                        ].map(([name, label]) => (
                          <label key={name} className="text-xs text-slate-400">{label}<input name={name} type="number" min="1" max="5" defaultValue="3" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <textarea name="strengths" rows={2} placeholder="Strengths" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <textarea name="areasForImprovement" rows={2} placeholder="Areas for improvement" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <textarea name="recommendedLearning" rows={2} placeholder="Recommended learning" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <textarea name="additionalNotes" rows={2} placeholder="Additional notes" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <select name="finalRecommendation" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{recommendations.map((item) => <option key={item}>{item}</option>)}</select>
                        <input name="completedAt" type="datetime-local" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <button className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950">Save feedback</button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center gap-2 text-white"><CalendarDays className="text-cyan-300" size={20} /><h2 className="font-bold">Calendar & conflicts</h2></div>
            <div className="space-y-3">
              {calendarRounds.length === 0 && <p className="text-sm text-slate-500">No scheduled interviews in current view.</p>}
              {calendarRounds.map((round) => {
                const conflictKey = round.scheduledAt && round.primaryInterviewerId ? `${round.primaryInterviewerId}-${round.scheduledAt.toISOString().slice(0, 13)}` : "";
                const hasConflict = conflictKey ? (conflictKeys.get(conflictKey) ?? 0) > 1 : false;
                return (
                  <div key={round.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                    <div className="flex items-start justify-between gap-2"><p className="font-semibold text-white">{round.profile.name}</p>{hasConflict && <AlertTriangle className="text-amber-300" size={16} />}</div>
                    <p className="text-cyan-200">{round.category}</p>
                    <p>{formatDateTime(round.scheduledAt)}</p>
                    <p className="text-xs text-slate-500">{round.primaryInterviewer?.name ?? "No interviewer"}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center gap-2 text-white"><CheckCircle2 className="text-emerald-300" size={20} /><h2 className="font-bold">Actions & reminders</h2></div>
            <div className="space-y-3">
              {activeActions.length === 0 && <p className="text-sm text-slate-500">No open interview actions.</p>}
              {activeActions.slice(0, 10).map((action) => (
                <form key={action.id} action={updateInterviewAction} className={`rounded-2xl border p-3 text-sm ${action.dueDate && action.dueDate < today ? "border-red-500/30 bg-red-500/10" : "border-slate-800 bg-slate-950/70"}`}>
                  <input type="hidden" name="actionId" value={action.id} />
                  <p className="font-semibold text-white">{action.actionType}</p>
                  <p className="mt-1 text-slate-400">{action.profile.name}</p>
                  <p className="text-xs text-slate-500">Owner: {action.owner?.name ?? "Unassigned"} · Due {formatDate(action.dueDate)}</p>
                  <select name="status" defaultValue={action.status} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>Open</option><option>Closed</option><option>Reschedule Required</option><option>Awaiting Manager Decision</option><option>Documentation Pending</option></select>
                  <button className="mt-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200">Update action</button>
                </form>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center gap-2 text-white"><FileText className="text-cyan-300" size={20} /><h2 className="font-bold">Reports & exports</h2></div>
            <textarea readOnly rows={12} value={reportText} className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-300" />
            <a download="atomix-interview-governance.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"><Download size={16} />Export CSV</a>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center gap-2 text-white"><History className="text-cyan-300" size={20} /><h2 className="font-bold">Governance KPIs</h2></div>
            <div className="grid gap-3 text-sm text-slate-300">
              <Kpi label="Average duration" value={`${Math.round(averageDuration)} min`} />
              <Kpi label="Feedback SLA pending" value={pendingFeedback} />
              <Kpi label="Mock completion" value={`${mockTotal ? Math.round((mockDone / mockTotal) * 100) : 0}%`} />
              <Kpi label="GIS completion" value={`${gisTotal ? Math.round((gisDone / gisTotal) * 100) : 0}%`} />
              <Kpi label="Selection rate" value={`${profiles.length ? Math.round((selected / profiles.length) * 100) : 0}%`} />
              <Kpi label="Rejection rate" value={`${profiles.length ? Math.round((rejected / profiles.length) * 100) : 0}%`} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

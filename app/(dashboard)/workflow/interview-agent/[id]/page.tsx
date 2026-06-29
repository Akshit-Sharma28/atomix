import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Download,
  Gauge,
  MessageSquarePlus,
  Star,
  Upload,
  UserCheck,
} from "lucide-react";
import type { InterviewFeedback } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canAccess } from "@/services/users/access.service";
import {
  saveCapabilityRating,
  saveInterviewFeedback,
  scheduleInterviewRound,
  updateInterviewProfile,
} from "../actions";

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

const timelineStages = [
  "Applied",
  "Screened",
  "Mock Interview",
  "GIS Interview",
  "Technical",
  "Manager Discussion",
  "Decision",
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
  "OWASP",
];

const ratings = ["Beginner", "Intermediate", "Advanced", "Expert"];
const recommendations = ["Strong Hire", "Hire", "Borderline", "Needs Upskilling", "Reject"];
const priorities = ["Low", "Medium", "High", "Critical"];

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
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

function daysBetween(first?: Date | null, second?: Date | null) {
  if (!first || !second) return null;
  return Math.max(0, Math.round((second.getTime() - first.getTime()) / 86400000));
}

function minutesBetween(first?: Date | null, second?: Date | null) {
  if (!first || !second) return null;
  return Math.max(1, Math.round((second.getTime() - first.getTime()) / 60000));
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function feedbackAverage(feedback: InterviewFeedback) {
  return average([
    feedback.technicalKnowledge,
    feedback.communication,
    feedback.problemSolving,
    feedback.securityFundamentals,
    feedback.webApplicationSecurity,
    feedback.apiSecurity,
    feedback.burpSuite,
    feedback.owasp,
    feedback.cloudSecurity,
    feedback.aiLlmSecurity,
    feedback.documentation,
    feedback.overallConfidence,
  ]);
}

function securityAverage(feedbacks: InterviewFeedback[]) {
  return average(
    feedbacks.flatMap((feedback) => [
      feedback.securityFundamentals,
      feedback.webApplicationSecurity,
      feedback.apiSecurity,
      feedback.burpSuite,
      feedback.owasp,
      feedback.cloudSecurity,
      feedback.aiLlmSecurity,
    ]),
  );
}

function capabilityScore(rating: string) {
  if (rating === "Expert") return 100;
  if (rating === "Advanced") return 75;
  if (rating === "Intermediate") return 50;
  return 25;
}

function recommendationRank(value?: string | null) {
  const ranks: Record<string, number> = {
    Reject: 1,
    "Needs Upskilling": 2,
    Borderline: 3,
    Hire: 4,
    "Strong Hire": 5,
  };
  return ranks[value ?? ""] ?? 0;
}

function statusClass(status: string) {
  if (["Selected", "Completed", "Closed", "Strong Hire", "Hire"].includes(status)) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (["Rejected", "Reject", "Overdue"].includes(status)) return "border-red-500/30 bg-red-500/10 text-red-200";
  if (["On Hold", "Future Consideration", "Needs Upskilling", "Borderline"].includes(status)) return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
}

function extractBullets(values: (string | null)[]) {
  return values
    .flatMap((value) => (value ?? "").split(/[\n;,.]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5);
}

async function getProfile(id: string) {
  return prisma.interviewProfile.findUnique({
    where: { id },
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
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      },
      capabilities: {
        orderBy: { technology: "asc" },
      },
      actions: {
        include: { owner: true },
        orderBy: { dueDate: "asc" },
      },
      audits: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });
}

export default async function CandidateDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
          <h1 className="text-2xl font-bold text-white">Candidate profile access restricted</h1>
          <p className="mt-2 text-slate-400">This candidate intelligence dashboard is available to interview governance roles only.</p>
        </div>
      </div>
    );
  }

  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const returnTo = `/workflow/interview-agent/${profile.id}`;
  const feedbacks = profile.rounds.map((round) => round.feedback).filter(isPresent);
  const scoreValues = feedbacks.flatMap((feedback) => [
    feedback.technicalKnowledge,
    feedback.communication,
    feedback.problemSolving,
    feedback.securityFundamentals,
    feedback.webApplicationSecurity,
    feedback.apiSecurity,
    feedback.burpSuite,
    feedback.owasp,
    feedback.cloudSecurity,
    feedback.aiLlmSecurity,
    feedback.documentation,
    feedback.overallConfidence,
  ]);
  const overallScore = Math.round((average(scoreValues) / 5) * 100);
  const latestRecommendation = feedbacks
    .slice()
    .sort((first, second) => recommendationRank(second.finalRecommendation) - recommendationRank(first.finalRecommendation))[0]?.finalRecommendation ?? "Pending";
  const currentStageIndex = Math.max(0, workflowStages.findIndex((stage) => stage === profile.status));
  const progress = workflowStages.includes(profile.status)
    ? Math.round(((currentStageIndex + 1) / workflowStages.length) * 100)
    : 20;
  const completedInterviews = profile.rounds.filter((round) => round.status === "Completed").length;
  const pendingInterviews = profile.rounds.filter((round) => round.status !== "Completed").length;
  const reschedules = profile.rounds.filter((round) => round.status.toLowerCase().includes("reschedule")).length + profile.actions.filter((action) => action.status.toLowerCase().includes("reschedule")).length;
  const averageTechnical = average(feedbacks.map((feedback) => feedback.technicalKnowledge));
  const averageCommunication = average(feedbacks.map((feedback) => feedback.communication));
  const averageSecurity = securityAverage(feedbacks);
  const overallCapabilityScore = Math.round(average(profile.capabilities.map((capability) => capabilityScore(capability.rating))));
  const totalDuration = profile.rounds.reduce((sum, round) => sum + (round.durationMinutes ?? minutesBetween(round.scheduledAt, round.completedAt) ?? 0), 0);
  const scheduledRounds = profile.rounds.filter((round) => round.scheduledAt);
  const averageDaysBetweenRounds = average(
    scheduledRounds.slice(1).map((round, index) => daysBetween(scheduledRounds[index].scheduledAt, round.scheduledAt) ?? 0),
  );
  const feedbackCompletion = profile.rounds.length === 0 ? 0 : Math.round((feedbacks.length / profile.rounds.length) * 100);
  const interviewCompletion = profile.rounds.length === 0 ? 0 : Math.round((completedInterviews / profile.rounds.length) * 100);
  const interviewerCount = new Set(
    profile.rounds.flatMap((round) => [round.primaryInterviewerId, round.secondaryInterviewerId, round.observerId]).filter(Boolean),
  ).size;
  const certificationsCount = (profile.certifications ?? "").split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean).length;
  const pendingFeedback = profile.rounds.some((round) => round.status !== "Completed" && round.scheduledAt && round.scheduledAt < new Date());
  const waitingManager = profile.status === "Manager Discussion" || profile.actions.some((action) => action.status === "Awaiting Manager Decision");
  const waitingRecruiter = profile.actions.some((action) => action.ownerId === profile.assignedRecruiterId && action.status !== "Closed");
  const openAction = profile.actions.find((action) => action.status !== "Closed");
  const strengths = extractBullets(feedbacks.map((feedback) => feedback.strengths));
  const improvements = extractBullets([...feedbacks.map((feedback) => feedback.areasForImprovement), ...feedbacks.map((feedback) => feedback.recommendedLearning)]);
  const trendPoints = feedbacks.map((feedback, index) => ({ label: `R${index + 1}`, value: Math.round((feedbackAverage(feedback) / 5) * 100) }));
  const capabilityBars = profile.capabilities.slice(0, 10).map((capability) => ({ label: capability.technology, value: capabilityScore(capability.rating), text: capability.rating }));
  const recommendationCounts = recommendations.map((recommendation) => ({
    label: recommendation,
    value: feedbacks.filter((feedback) => feedback.finalRecommendation === recommendation).length,
  }));
  const csv = [
    ["Round", "Technical", "Communication", "Problem Solving", "Security", "Recommendation"],
    ...profile.rounds.map((round) => [
      round.category,
      round.feedback?.technicalKnowledge ?? "",
      round.feedback?.communication ?? "",
      round.feedback?.problemSolving ?? "",
      round.feedback ? securityAverage([round.feedback]).toFixed(1) : "",
      round.feedback?.finalRecommendation ?? "",
    ]),
  ].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const report = `Candidate Report\n\n${profile.name} (${profile.candidateCode})\nKind: ${profile.interviewKind}\nStage: ${profile.status}\nOverall Score: ${overallScore}%\nRecommendation: ${latestRecommendation}\nCompleted Interviews: ${completedInterviews}\nPending Interviews: ${pendingInterviews}\nTechnical Avg: ${averageTechnical.toFixed(1)}\nCommunication Avg: ${averageCommunication.toFixed(1)}\nSecurity Avg: ${averageSecurity.toFixed(1)}\nCapability Score: ${overallCapabilityScore}%\nNext Action: ${openAction?.actionType ?? "No open action"}`;

  return (
    <div className="w-full overflow-hidden px-6 py-6 lg:px-8">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <Link href="/workflow/interview-agent" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
          <ArrowLeft size={16} /> Back to Interview Agent
        </Link>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Candidate Intelligence Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-white">{profile.name}</h1>
            <p className="mt-2 max-w-4xl text-slate-400">{profile.candidateCode} · {profile.interviewKind} · {profile.experience ?? "Experience TBD"} · {profile.currentRole ?? "Role TBD"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a download={`${profile.candidateCode}-candidate-report.txt`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(report)}`} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"><Download size={16} />Download Candidate Report</a>
            <a download={`${profile.candidateCode}-feedback.csv`} href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-3 text-sm font-bold text-cyan-200"><Download size={16} />Export Feedback</a>
          </div>
        </div>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <KpiCard label="Overall Interview Score" value={`${overallScore}%`} helper="All ratings combined" tone="cyan" />
        <KpiCard label="Overall Recommendation" value={latestRecommendation} helper="Best/current signal" tone="emerald" />
        <KpiCard label="Current Interview Stage" value={profile.status} helper="Workflow status" tone="cyan" />
        <KpiCard label="Overall Progress" value={`${progress}%`} helper="Recruitment workflow" tone="emerald" />
        <KpiCard label="Completed Interviews" value={completedInterviews} helper="Rounds completed" tone="cyan" />
        <KpiCard label="Pending Interviews" value={pendingInterviews} helper="Rounds pending" tone="amber" />
        <KpiCard label="Reschedules" value={reschedules} helper="Round/action signals" tone="amber" />
        <KpiCard label="Feedback Submitted" value={feedbacks.length} helper="Completed feedbacks" tone="emerald" />
        <KpiCard label="Avg Technical" value={averageTechnical.toFixed(1)} helper="Rating / 5" tone="cyan" />
        <KpiCard label="Avg Communication" value={averageCommunication.toFixed(1)} helper="Rating / 5" tone="cyan" />
        <KpiCard label="Avg Security" value={averageSecurity.toFixed(1)} helper="Rating / 5" tone="cyan" />
        <KpiCard label="Capability Score" value={`${overallCapabilityScore}%`} helper="Skill matrix" tone="emerald" />
      </section>

      <section className="mb-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-400">Common candidate operations stay governed and auditable.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">Owner: {openAction?.owner?.name ?? profile.assignedRecruiter?.name ?? "Unassigned"}</span>
            <span className={`rounded-full border px-3 py-1 ${pendingFeedback ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>SLA: {pendingFeedback ? "Attention" : "Healthy"}</span>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <form action={scheduleInterviewRound} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <p className="mb-3 flex items-center gap-2 font-bold text-white"><CalendarPlus size={18} className="text-cyan-300" />Schedule / Assign Interviewer</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="category" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{interviewCategories.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="stage" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{workflowStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
              <select name="primaryInterviewerId" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Primary interviewer</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
              <select name="secondaryInterviewerId" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Secondary interviewer</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
              <input name="scheduledAt" type="datetime-local" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <input name="durationMinutes" type="number" min="15" defaultValue="60" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            </div>
            <input name="meetingLink" placeholder="Meeting link" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input name="comments" placeholder="Notes / attachment reference" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <button className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Schedule Interview</button>
          </form>

          <form action={updateInterviewProfile} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <p className="mb-3 flex items-center gap-2 font-bold text-white"><UserCheck size={18} className="text-cyan-300" />Update Status / Notes</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="status" defaultValue={profile.status} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{workflowStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
              <select name="priority" defaultValue={profile.priority} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
              <select name="assignedRecruiterId" defaultValue={profile.assignedRecruiterId ?? ""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Recruiter</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
              <select name="hiringManagerId" defaultValue={profile.hiringManagerId ?? ""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Hiring manager</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
            </div>
            <input name="currentRole" defaultValue={profile.currentRole ?? ""} placeholder="Current role" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input name="skills" defaultValue={profile.skills ?? ""} placeholder="Skills / Add notes" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input name="certifications" defaultValue={profile.certifications ?? ""} placeholder="Certifications" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input name="tags" defaultValue={profile.tags ?? ""} placeholder="Tags" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <button className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Update Status</button>
          </form>

          <form action={saveCapabilityRating} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <p className="mb-3 flex items-center gap-2 font-bold text-white"><Upload size={18} className="text-cyan-300" />Upload Resume / Add Capability</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="technology" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{technologies.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="rating" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select>
            </div>
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">Resume uploads are tracked by reference in this module; sensitive HR fields are intentionally excluded.</p>
            <button className="mt-3 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-bold text-cyan-200">Save Capability</button>
          </form>
        </div>
      </section>

      <div className="mb-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Interview Timeline</h2>
          <div className="space-y-3">
            {timelineStages.map((stage) => {
              const round = profile.rounds.find((item) => item.category.includes(stage.replace("Screened", "Resume")) || item.stage.includes(stage));
              const isDone = Boolean(round?.status === "Completed" || profile.status.includes(stage));
              return (
                <div key={stage} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[11rem_1fr]">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-full ${isDone ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-400"}`}>{isDone ? <CheckCircle2 size={17} /> : <span className="h-2 w-2 rounded-full bg-current" />}</div>
                    <p className="font-bold text-white">{stage}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-5">
                    <span>Date: {formatDate(round?.scheduledAt ?? (stage === "Applied" ? profile.createdAt : null))}</span>
                    <span>Interviewer: {round?.primaryInterviewer?.name ?? "TBD"}</span>
                    <span>Status: {round?.status ?? (stage === "Applied" ? "Completed" : "Pending")}</span>
                    <span>Duration: {round?.durationMinutes ? `${round.durationMinutes} min` : "TBD"}</span>
                    <span className="truncate">Comments: {round?.comments ?? "No comments"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Capability Summary</h2>
          <div className="space-y-3">
            {capabilityBars.length === 0 && <p className="text-sm text-slate-500">No capability ratings yet.</p>}
            {capabilityBars.map((capability) => (
              <div key={capability.label}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{capability.label}</span><span className="font-semibold text-cyan-200">{capability.text}</span></div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${capability.value}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-white">Interview Performance</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.rounds.map((round) => (
              <div key={round.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="font-bold text-white">{round.category}</h3><p className="text-xs text-slate-500">{formatDateTime(round.scheduledAt)}</p></div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(round.feedback?.finalRecommendation ?? round.status)}`}>{round.feedback?.finalRecommendation ?? round.status}</span>
                </div>
                {round.feedback ? (
                  <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <KpiLine label="Technical" value={round.feedback.technicalKnowledge} max={5} />
                    <KpiLine label="Communication" value={round.feedback.communication} max={5} />
                    <KpiLine label="Problem Solving" value={round.feedback.problemSolving} max={5} />
                    <KpiLine label="Security" value={securityAverage([round.feedback]).toFixed(1)} max={5} />
                  </div>
                ) : <p className="text-sm text-slate-500">Feedback pending.</p>}
              </div>
            ))}
            {profile.rounds.length === 0 && <p className="text-sm text-slate-500">No interviews scheduled yet.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Strength & Improvement Summary</h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="mb-2 font-semibold text-emerald-200">Top Strengths</p>
            <ul className="space-y-2 text-sm text-slate-300">{(strengths.length ? strengths : ["Awaiting interviewer feedback."]).map((item) => <li key={item}>• {item}</li>)}</ul>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="mb-2 font-semibold text-amber-200">Areas to Improve</p>
            <ul className="space-y-2 text-sm text-slate-300">{(improvements.length ? improvements : ["No improvement areas captured yet."]).map((item) => <li key={item}>• {item}</li>)}</ul>
          </div>
        </section>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-4">
        <ChartCard title="Interview Rating Trend"><LineTrend data={trendPoints} /></ChartCard>
        <ChartCard title="Skill Distribution"><BarChart data={capabilityBars.slice(0, 6)} /></ChartCard>
        <ChartCard title="Interview Progress"><ProgressRing value={interviewCompletion} /></ChartCard>
        <ChartCard title="Recommendation Distribution"><BarChart data={recommendationCounts} /></ChartCard>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Candidate Analytics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiMini label="Total Interview Duration" value={`${totalDuration} min`} />
            <KpiMini label="Avg Days Between Rounds" value={averageDaysBetweenRounds.toFixed(1)} />
            <KpiMini label="Feedback Completion" value={`${feedbackCompletion}%`} />
            <KpiMini label="Interview Completion" value={`${interviewCompletion}%`} />
            <KpiMini label="Recommendation Trend" value={latestRecommendation} />
            <KpiMini label="Interviewers" value={interviewerCount} />
            <KpiMini label="Skills Assessed" value={profile.capabilities.length} />
            <KpiMini label="Certifications" value={certificationsCount} />
            <KpiMini label="Experience" value={profile.experience ?? "TBD"} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Governance Insights</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Insight label="Feedback Pending" active={pendingFeedback} />
            <Insight label="SLA Status" active={pendingFeedback} activeText="Attention" inactiveText="Healthy" />
            <Insight label="Waiting for Manager Review" active={waitingManager} />
            <Insight label="Waiting for Candidate" active={profile.status === "On Hold"} />
            <Insight label="Waiting for Recruiter" active={waitingRecruiter} />
            <KpiMini label="Next Action Required" value={openAction?.actionType ?? "No open action"} />
            <KpiMini label="Assigned Owner" value={openAction?.owner?.name ?? profile.assignedRecruiter?.name ?? "Unassigned"} />
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Candidate Activity Feed</h2>
          <div className="space-y-3">
            {[
              profile.resumeFileName ? { id: "resume", user: profile.assignedRecruiter?.name ?? "System", createdAt: profile.createdAt, description: `Resume uploaded: ${profile.resumeFileName}` } : null,
              ...profile.rounds.map((round) => ({ id: round.id, user: round.primaryInterviewer?.name ?? "System", createdAt: round.createdAt, description: `${round.category} ${round.status.toLowerCase()}` })),
              ...feedbacks.map((feedback) => ({ id: feedback.id, user: "Interviewer", createdAt: feedback.createdAt, description: `Feedback submitted: ${feedback.finalRecommendation}` })),
              ...profile.audits.map((audit) => ({ id: audit.id, user: audit.user ?? "System", createdAt: audit.createdAt, description: `${audit.action}${audit.fieldChanged ? ` - ${audit.fieldChanged}` : ""}` })),
            ]
              .filter(isPresent)
              .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
              .slice(0, 15)
              .map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm">
                  <p className="font-semibold text-white">{activity.description}</p>
                  <p className="mt-1 text-xs text-slate-500">{activity.user} · {formatDateTime(activity.createdAt)}</p>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Submit Feedback</h2>
          {profile.rounds.length === 0 ? <p className="text-sm text-slate-500">Schedule an interview before submitting feedback.</p> : (
            <form action={saveInterviewFeedback}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <select name="roundId" className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{profile.rounds.map((round) => <option key={round.id} value={round.id}>{round.category} · {formatDate(round.scheduledAt)}</option>)}</select>
              <div className="grid gap-3 sm:grid-cols-3">
                {["technicalKnowledge", "communication", "problemSolving", "securityFundamentals", "webApplicationSecurity", "apiSecurity", "burpSuite", "owasp", "cloudSecurity", "aiLlmSecurity", "documentation", "overallConfidence"].map((name) => <input key={name} name={name} type="number" min="1" max="5" defaultValue="3" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />)}
              </div>
              <textarea name="strengths" rows={2} placeholder="Strengths" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <textarea name="areasForImprovement" rows={2} placeholder="Areas for improvement" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <textarea name="recommendedLearning" rows={2} placeholder="Recommended learning" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <textarea name="additionalNotes" rows={2} placeholder="Additional notes" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <div className="mt-3 flex flex-wrap gap-3">
                <select name="finalRecommendation" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{recommendations.map((item) => <option key={item}>{item}</option>)}</select>
                <input name="completedAt" type="datetime-local" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                <button className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950"><MessageSquarePlus size={16} className="inline" /> Submit Feedback</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, helper, tone }: { label: string; value: string | number; helper: string; tone: "cyan" | "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-cyan-300";
  return (
    <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between text-slate-400"><span className="text-xs uppercase tracking-[0.16em]">{label}</span><Gauge size={18} className={color} /></div>
      <p className={`mt-3 text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function KpiLine({ label, value, max }: { label: string; value: string | number; max: number }) {
  const numeric = Number(value);
  const width = Number.isFinite(numeric) ? Math.min(100, (numeric / max) * 100) : 0;
  return <div><div className="mb-1 flex justify-between"><span>{label}</span><span className="text-cyan-200">{value}</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${width}%` }} /></div></div>;
}

function KpiMini({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-bold text-white">{value}</p></div>;
}

function Insight({ label, active, activeText = "Yes", inactiveText = "No" }: { label: string; active: boolean; activeText?: string; inactiveText?: string }) {
  return <div className={`rounded-2xl border p-3 ${active ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/20 bg-emerald-500/10"}`}><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 font-bold ${active ? "text-amber-200" : "text-emerald-200"}`}>{active ? activeText : inactiveText}</p></div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 font-bold text-white"><Star className="text-cyan-300" size={18} />{title}</h2>{children}</section>;
}

function LineTrend({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-500">No feedback trend yet.</p>;
  const points = data.map((item, index) => `${(index / Math.max(1, data.length - 1)) * 260},${90 - item.value * 0.75}`).join(" ");
  return <svg viewBox="0 0 280 110" className="h-36 w-full"><polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{data.map((item, index) => <g key={item.label}><circle cx={(index / Math.max(1, data.length - 1)) * 260} cy={90 - item.value * 0.75} r="4" fill="#67e8f9" /><text x={(index / Math.max(1, data.length - 1)) * 260} y="108" fill="#94a3b8" fontSize="10">{item.label}</text></g>)}</svg>;
}

function BarChart({ data }: { data: { label: string; value: number; text?: string }[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-500">No chart data yet.</p>;
  return <div className="space-y-3">{data.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span className="truncate text-slate-300">{item.label}</span><span className="text-cyan-200">{item.text ?? item.value}</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${Math.min(100, item.value * (item.value <= 5 ? 20 : 1))}%` }} /></div></div>)}</div>;
}

function ProgressRing({ value }: { value: number }) {
  const degrees = Math.min(100, Math.max(0, value)) * 3.6;
  return <div className="grid place-items-center"><div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(#22d3ee ${degrees}deg, #1e293b ${degrees}deg)` }}><div className="grid h-24 w-24 place-items-center rounded-full bg-slate-950"><span className="text-2xl font-black text-cyan-200">{value}%</span></div></div></div>;
}

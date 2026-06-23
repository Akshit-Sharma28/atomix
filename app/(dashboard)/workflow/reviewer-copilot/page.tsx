import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import ReviewerCopilotAgent from "@/components/agents/reviewer-copilot-agent";
import { canAccess } from "@/services/users/access.service";

export default async function ReviewerCopilotPage() {
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "REVIEWER",
    "RETESTER",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Reviewer Copilot access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            Reviewer Copilot is available to reviewer, retest, QA, validator,
            governance, and admin roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <Link
          href="/workflow"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={16} />
          Back to Workflow
        </Link>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} />
          Reviewer Workspace Agent
        </div>
        <h1 className="text-3xl font-bold text-white">
          Reviewer Copilot Agent
        </h1>
        <p className="mt-2 max-w-4xl text-slate-400">
          Assist reviewers during authorized infosec reviews with passive web
          posture checks, reviewer planning, FEAD-style control mapping, and
          LLM prompt scenarios for model-enabled applications.
        </p>
      </div>

      <ReviewerCopilotAgent />
    </div>
  );
}

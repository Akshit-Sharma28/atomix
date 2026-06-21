import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";

import PeerReviewAgent from "@/components/agents/peer-review-agent";
import { canAccess } from "@/services/users/access.service";

export default async function PeerReviewWorkflowPage() {
  const allowed = await canAccess(["ADMIN", "GOVERNANCE_TEAM", "QA_REVIEWER"]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Peer review agent access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            Peer Review Agent is available to Admin, Governance Team, and QA
            Reviewer roles.
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
          <FileSearch size={16} />
          Artifact Review Agent
        </div>
        <h1 className="text-3xl font-bold text-white">Peer Review Agent</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Review FEAD, BEAD, LLM FEAD, scan evidence, scope details, and risk
          context for missed controls or testing gaps before sign-off.
        </p>
      </div>

      <PeerReviewAgent />
    </div>
  );
}

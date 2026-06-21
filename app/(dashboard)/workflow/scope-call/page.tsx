import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import ScopeCallAgent from "@/components/agents/scope-call-agent";
import { canAccess } from "@/services/users/access.service";

export default async function ScopeCallWorkflowPage() {
  const allowed = await canAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Scope agent access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            Scope Call Agent is available to Admin and Governance Team roles.
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
          <ClipboardList size={16} />
          Structured Intake Agent
        </div>
        <h1 className="text-3xl font-bold text-white">Scope Call Agent</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Capture demo-call inputs and generate a pre-review scope document
          before testing starts. This flow uses a dedicated API and falls back
          to deterministic output if local AI is unavailable.
        </p>
      </div>

      <ScopeCallAgent />
    </div>
  );
}

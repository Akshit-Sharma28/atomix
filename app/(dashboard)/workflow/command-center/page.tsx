import Link from "next/link";
import { ArrowLeft, TerminalSquare } from "lucide-react";

import AgentCommandConsole from "@/components/agents/agent-command-console";
import { canAccess } from "@/services/users/access.service";

export default async function AgentCommandCenterPage() {
  const allowed = await canAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            DB action builder access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            DB Action Builder Agent is available to Admin and Governance Team roles.
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
          <TerminalSquare size={16} />
          Controlled DB Action Runner
        </div>
        <h1 className="text-3xl font-bold text-white">
          DB Action Builder Agent
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Build safe database write commands through forms. Assignment and
          intake recommendations live on the main Workflow page; this workspace
          is for explicit user, project, SR, finding, and peer-review actions.
        </p>
      </div>

      <AgentCommandConsole />
    </div>
  );
}

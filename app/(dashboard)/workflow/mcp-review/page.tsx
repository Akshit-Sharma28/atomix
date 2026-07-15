import Link from "next/link";
import { ArrowLeft, BookOpen, Network } from "lucide-react";

import McpReviewAgent from "@/components/agents/mcp-review-agent";
import { canAccess } from "@/services/users/access.service";

export default async function McpReviewWorkflowPage() {
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "REVIEWER",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            MCP review agent access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            MCP Review Agent is available to Atomix governance, validator, QA,
            and reviewer roles.
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
          <Network size={16} />
          MCP Security Review
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">MCP Review Agent</h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Generate an MCP-specific FEAD workbook and security review guide for
              Model Context Protocol servers, tools, resources, prompts, roots,
              sampling, elicitation, and transport security.
            </p>
          </div>
          <Link
            href="/workflow/mcp-review/tutorial"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 hover:bg-violet-400/20"
          >
            <BookOpen size={17} />
            MCP Tutorial &amp; JSON-RPC Guide
          </Link>
        </div>
      </div>

      <McpReviewAgent />
    </div>
  );
}

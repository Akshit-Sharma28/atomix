import { Brain } from "lucide-react";
import KnowledgeForm from "../../components/copilot/knowledge-form";
import ReportUpload
from "../../components/copilot/report-upload";

export default function KnowledgePage() {
  return (
    <div className="max-w-7xl mx-auto p-8">

      <div className="flex items-center gap-4 mb-8">

        <Brain
          size={40}
          className="text-cyan-400"
        />

        <div>

          <h1 className="text-5xl font-bold">
            Knowledge Base
          </h1>

          <p className="text-slate-400">
            Pentest playbooks,
            LLM guidance,
            MCP testing notes
          </p>

        </div>

      </div>

      <KnowledgeForm />

      <ReportUpload />

    </div>
  );
}
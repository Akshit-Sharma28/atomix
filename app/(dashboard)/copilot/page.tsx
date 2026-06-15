import CopilotChat
from "@/components/copilot/chat";

import History
from "@/components/copilot/history";

import {
  getConversationHistory,
} from "@/services/copilot/history.service";

import { Bot } from "lucide-react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    prompt?: string;
  }>;
}) {
  const history =
    await getConversationHistory();
  const params = await searchParams;
  const initialPrompt = params.prompt ?? "";

  return (
    <div className="max-w-7xl mx-auto p-8">

      <div className="mb-8">

        <div className="flex items-center gap-4">

          <Bot
            size={42}
            className="text-cyan-400"
          />

          <div>

            <h1 className="text-5xl font-bold">
              Security Copilot
            </h1>

            <p className="text-slate-400">
              AI-powered security assistant
            </p>

          </div>

        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <CopilotChat initialPrompt={initialPrompt} />
        </div>

        <History
          history={history}
        />

      </div>

    </div>
  );
}

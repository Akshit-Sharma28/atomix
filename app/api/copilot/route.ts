import { prisma } from "../../../lib/prisma";

import {
  buildContext,
} from "../../../services/copilot/context.service";

import {
  askCopilot,
} from "../../../services/ai/openai.service";
import {
  runMcpAugmentedAgent,
} from "../../../services/agents/mcp-agent-runner.service";

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const question =
      body.question;

    if (!question) {
      return Response.json(
        {
          error:
            "Question is required",
        },
        {
          status: 400,
        }
      );
    }

    const context =
      await buildContext();

    let answer = "";
    let mode = "mcp-agentic";
    let agentTrace: unknown[] = [];

    try {
      const result = await runMcpAugmentedAgent(
        question,
        context,
      );

      answer = result.answer;
      agentTrace = result.trace;
      mode =
        result.synthesisMode === "deterministic"
          ? "mcp-deterministic"
          : "mcp-agentic";
    } catch (error) {
      mode = "prompt-fallback";
      try {
        answer =
          await askCopilot(
            question,
            context
          );
      } catch {
        answer = `## Atomix Agent Result

I could not complete the MCP agent loop or the prompt-only LLM fallback.

### Request
${question}

### Next Actions
- Confirm the MCP token and local AI tunnel are available.
- Retry from the MCP Review Agent inspector to verify raw tool access.
- Use the dashboard queues directly while the synthesis path recovers.`;
      }
      agentTrace = [
        {
          step: 1,
          toolName: "prompt-fallback",
          status: "failed",
          summary:
            error instanceof Error
              ? error.message
              : "MCP agent loop failed; used prompt-only fallback.",
        },
      ];
    }

    await prisma.copilotConversation.create({
      data: {
        question,
        answer:
          answer ?? "",
      },
    });

    return Response.json({
      answer,
      mode,
      agentTrace,
    });
  } catch (error) {
    console.error(
      "Copilot Error:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to process request",
      },
      {
        status: 500,
      }
    );
  }
}

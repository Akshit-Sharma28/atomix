import { prisma } from "../../../lib/prisma";

import {
  buildContext,
} from "../../../services/copilot/context.service";

import {
  askCopilot,
} from "../../../services/ai/openai.service";

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

    const answer =
      await askCopilot(
        question,
        context
      );

    await prisma.copilotConversation.create({
      data: {
        question,
        answer:
          answer ?? "",
      },
    });

    return Response.json({
      answer,
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
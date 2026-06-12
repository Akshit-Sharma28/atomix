import { prisma } from "../../lib/prisma";

export async function
getConversationHistory() {
  return prisma.copilotConversation.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
}
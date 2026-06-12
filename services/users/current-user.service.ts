import { prisma } from "../../lib/prisma";

export async function getCurrentUser() {
  const session =
    await prisma.appSession.findFirst({
      include: {
        user: true,
      },
    });

  return session?.user ?? null;
}
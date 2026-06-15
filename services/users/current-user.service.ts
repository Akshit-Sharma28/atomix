import { prisma } from "../../lib/prisma";

export async function getCurrentUser() {
  const session =
    await prisma.appSession.findFirst({
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  return session?.user ?? null;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "../../lib/prisma";

export async function getCurrentUser() {
  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;

  if (email) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (user) {
      return user;
    }
  }

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

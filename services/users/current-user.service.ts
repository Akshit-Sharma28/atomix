import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
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
      const cookieStore = await cookies();
      const previewUserId = cookieStore.get("atomix_preview_user_id")?.value;

      if (user.role === "ADMIN" && previewUserId) {
        const previewUser = await prisma.user.findUnique({
          where: {
            id: previewUserId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        if (previewUser?.id && previewUser.id !== user.id) {
          return {
            ...previewUser,
            previewedBy: user,
          };
        }
      }

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

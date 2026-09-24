import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { cache } from "react";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "../../lib/prisma";

export const getCurrentUser = cache(async function getCurrentUser() {
  const authSession = await getServerSession(authOptions);
  const sessionUser = authSession?.user;

  if (sessionUser?.id) {
    const user = {
      id: sessionUser.id,
      name: sessionUser.name ?? "User",
      email: sessionUser.email ?? "",
      role: sessionUser.role,
    };

    if (user.role === "ADMIN") {
      const cookieStore = await cookies();
      const previewUserId = cookieStore.get("atomix_preview_user_id")?.value;

      if (previewUserId) {
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

    }

    return user;
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
});

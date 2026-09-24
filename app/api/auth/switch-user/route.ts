import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

async function getSessionAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" ? session.user : null;
}

export async function GET() {
  const admin = await getSessionAdmin();

  if (!admin) {
    return Response.json(
      {
        users: [],
      },
      {
        status: 403,
      }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: [
      {
        role: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return Response.json(
    {
      users,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(req: Request) {
  const admin = await getSessionAdmin();

  if (!admin) {
    return Response.json(
      {
        error: "Only admin users can preview another user.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: {
      id: body.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    return Response.json(
      {
        error: "User not found",
      },
      {
        status: 404,
      }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("atomix_preview_user_id", body.userId, {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    sameSite: "lax",
  });

  return Response.json({
    success: true,
    user,
  });
}

export async function DELETE() {
  const admin = await getSessionAdmin();

  if (!admin) {
    return Response.json(
      {
        error: "Only admin users can clear preview mode.",
      },
      {
        status: 403,
      }
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete("atomix_preview_user_id");

  return Response.json({
    success: true,
  });
}

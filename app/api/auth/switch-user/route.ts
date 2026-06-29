import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

async function getSessionAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      role: true,
    },
  });

  return user?.role === "ADMIN" ? user : null;
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
  });

  if (!user) {
    return Response.json(
      {
        error: "User not found",
      },
      {
        status: 404,
      }
    );
  }

  const session = await prisma.appSession.findFirst();

  if (session) {
    await prisma.appSession.update({
      where: {
        id: session.id,
      },
      data: {
        currentUserId: body.userId,
      },
    });
  } else {
    await prisma.appSession.create({
      data: {
        currentUserId: body.userId,
      },
    });
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

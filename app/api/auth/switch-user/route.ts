import { prisma } from "../../../../lib/prisma";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const user =
    await prisma.user.findUnique({
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

  const session =
    await prisma.appSession.findFirst();

  if (session) {
    await prisma.appSession.update({
      where: {
        id: session.id,
      },
      data: {
        currentUserId:
          body.userId,
      },
    });
  } else {
    await prisma.appSession.create({
      data: {
        currentUserId:
          body.userId,
      },
    });
  }

  return Response.json({
    success: true,
  });
}
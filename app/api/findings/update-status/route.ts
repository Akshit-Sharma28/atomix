import { prisma } from "../../../../lib/prisma";
import {
  getCurrentUser,
} from "../../../../services/users/current-user.service";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const currentUser =
    await getCurrentUser();

  const finding =
    await prisma.finding.findUnique({
      where: {
        id: body.findingId,
      },
    });

  if (!finding) {
    return Response.json(
      {
        error: "Finding not found",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.finding.update({
    where: {
      id: finding.id,
    },
    data: {
      status: body.status,
    },
  });

  await prisma.findingActivity.create({
    data: {
      findingId: finding.id,

      action: "Status Changed",

      actor:
        currentUser?.email ??
        "System",

      oldValue:
        finding.status,

      newValue:
        body.status,
    },
  });

  return Response.json({
    success: true,
  });
}
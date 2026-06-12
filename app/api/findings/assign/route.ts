import { prisma } from "../../../../lib/prisma";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: {
      id: body.userId,
    },
  });

  if (!user) {
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const finding =
    await prisma.finding.update({
      where: {
        id: body.findingId,
      },
      data: {
        ownerId: body.userId,
        status: "Assigned",
      },
    });

  await prisma.findingActivity.create({
    data: {
      findingId: finding.id,
      action: "Finding Assigned",
      actor: "System",
      oldValue: "Unassigned",
      newValue: user.email,
    },
  });

  return Response.json(finding);
}
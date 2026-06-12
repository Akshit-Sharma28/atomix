import { prisma } from "../../../../lib/prisma";

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    if (
      !body.findingId ||
      !body.ownerId
    ) {
      return Response.json(
        {
          error:
            "findingId and ownerId are required",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: body.ownerId,
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

    const finding =
      await prisma.finding.findUnique({
        where: {
          id: body.findingId,
        },
        include: {
          owner: true,
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

    const updatedFinding =
      await prisma.finding.update({
        where: {
          id: body.findingId,
        },
        data: {
          ownerId: body.ownerId,
          status: "Assigned",
        },
        include: {
          owner: true,
        },
      });

    await prisma.findingActivity.create({
      data: {
        findingId: body.findingId,

        action: "Owner Assigned",

        actor: "System",

        oldValue:
          finding.owner?.email ??
          "Unassigned",

        newValue:
          user.email,
      },
    });

    if (
      finding.status !==
      "Assigned"
    ) {
      await prisma.findingActivity.create({
        data: {
          findingId: body.findingId,

          action:
            "Status Updated",

          actor: "System",

          oldValue:
            finding.status,

          newValue:
            "Assigned",
        },
      });
    }

    return Response.json({
      success: true,
      finding:
        updatedFinding,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
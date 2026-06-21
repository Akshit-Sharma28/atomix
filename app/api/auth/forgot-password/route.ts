import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
    };

    const email =
      body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return Response.json(
        {
          ok: false,
          message: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (user?.isActive) {
      console.info(
        `Password reset requested for Atomix user ${user.email}. Admin reset required from /users.`
      );
    }

    return Response.json({
      ok: true,
      message:
        "If the account exists, an Atomix admin can reset it from User Administration.",
    });
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Unable to process password reset request.",
      },
      {
        status: 500,
      }
    );
  }
}

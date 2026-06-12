import { prisma } from "../../../lib/prisma";

export async function PATCH(
  req: Request
) {
  const body = await req.json();

  const user =
    await prisma.user.update({
      where: {
        id: body.userId,
      },
      data: {
        role: body.role,
      },
    });

  return Response.json(user);
}
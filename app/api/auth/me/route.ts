import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const user =
    await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

  return Response.json(user);
}
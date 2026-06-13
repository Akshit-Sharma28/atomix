import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const user =
    await prisma.user.findUnique({
      where: {
        email:
          "admin@atomix.ai",
      },
    });

  if (!user) {
    console.log(
      "Admin user not found"
    );
    return;
  }

  const existing =
    await prisma.account.findFirst({
      where: {
        userId: user.id,
      },
    });

  if (existing) {
    console.log(
      "Account already exists"
    );
    return;
  }

  const passwordHash =
    await bcrypt.hash(
      "Atomix123!",
      10
    );

  await prisma.account.create({
    data: {
      userId: user.id,
      passwordHash,
    },
  });

  console.log(
    "Admin account created"
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
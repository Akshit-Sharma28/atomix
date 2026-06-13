import bcrypt from "bcryptjs";

import { prisma }
from "../lib/prisma";

async function main() {
  const user =
    await prisma.user.findFirst({
      where: {
        email:
          "admin@atomix.ai",
      },
    });

  if (!user) {
    throw new Error(
      "Admin not found"
    );
  }

  const hash =
    await bcrypt.hash(
      "Atomix123!",
      10
    );

  await prisma.account.upsert({
    where: {
      userId: user.id,
    },
    update: {
      passwordHash: hash,
    },
    create: {
      userId: user.id,
      passwordHash: hash,
    },
  });

  console.log(
    "Admin password created"
  );
}

main()
  .catch(console.error)
  .finally(() =>
    prisma.$disconnect()
  );
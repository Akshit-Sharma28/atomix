import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createUser(
  name: string,
  email: string,
  role:
    | "ADMIN"
    | "SECURITY_LEAD"
    | "CONSULTANT"
    | "DEVELOPER"
    | "VIEWER"
) {
  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        name,
        email,
        role,
      },
    });

    console.log(`Created ${email}`);
  } else {
    console.log(`${email} already exists`);
  }
}

async function main() {
  await createUser(
    "Admin",
    "admin@atomix.ai",
    "ADMIN"
  );

  await createUser(
    "Security Lead",
    "lead@atomix.ai",
    "SECURITY_LEAD"
  );

  await createUser(
    "Consultant",
    "consultant@atomix.ai",
    "CONSULTANT"
  );

  await createUser(
    "Developer",
    "developer@atomix.ai",
    "DEVELOPER"
  );

  await createUser(
    "Viewer",
    "viewer@atomix.ai",
    "VIEWER"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
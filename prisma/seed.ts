import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createUser(
  name: string,
  email: string,
  role:
    | "ADMIN"
    | "GOVERNANCE_TEAM"
    | "QA_REVIEWER"
    | "REVIEWER"
    | "ENGAGEMENT_MANAGER"
    | "CONSULTANT"
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
    "Governance Lead",
    "governance@atomix.ai",
    "GOVERNANCE_TEAM"
  );

  await createUser(
    "QA Reviewer",
    "qa@atomix.ai",
    "QA_REVIEWER"
  );

  await createUser(
    "Reviewer",
    "reviewer@atomix.ai",
    "REVIEWER"
  );

  await createUser(
    "Engagement Manager",
    "em@atomix.ai",
    "ENGAGEMENT_MANAGER"
  );

  await createUser(
    "Consultant",
    "consultant@atomix.ai",
    "CONSULTANT"
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

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: "Admin",
        email: "admin@atomix.local",
        role: "ADMIN",
      },
      {
        name: "Lead",
        email: "lead@atomix.local",
        role: "SECURITY_LEAD",
      },
      {
        name: "Consultant",
        email: "consultant@atomix.local",
        role: "CONSULTANT",
      },
      {
        name: "Developer",
        email: "developer@atomix.local",
        role: "DEVELOPER",
      },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
import {
  PrismaClient,
} from "@prisma/client";

const prisma =
  new PrismaClient();

function getSLADays(
  severity: string
) {
  switch (severity) {
    case "Critical":
      return 7;

    case "High":
      return 14;

    case "Medium":
      return 30;

    case "Low":
      return 60;

    default:
      return 30;
  }
}

async function main() {
  const findings =
    await prisma.finding.findMany();

  for (const finding of findings) {
    const slaDays =
      getSLADays(
        finding.severity
      );

    const dueDate =
      new Date(
        finding.createdAt
      );

    dueDate.setDate(
      dueDate.getDate() +
        slaDays
    );

    await prisma.finding.update({
      where: {
        id: finding.id,
      },
      data: {
        slaDays,
        dueDate,
      },
    });
  }

  console.log(
    `Updated ${findings.length} findings`
  );
}

main()
  .catch(console.error)
  .finally(() =>
    prisma.$disconnect()
  );
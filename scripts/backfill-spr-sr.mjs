import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const reviewTypes = ["FRONTEND", "BACKEND", "API", "MSB", "LLM"];

function pad(value) {
  return String(value).padStart(4, "0");
}

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const reviewers = users.filter((user) =>
    ["ADMIN", "GOVERNANCE_TEAM", "QA_REVIEWER", "REVIEWER", "CONSULTANT", "SECURITY_LEAD", "DEVELOPER"].includes(user.role)
  );

  for (const [index, user] of reviewers.entries()) {
    const profile = await prisma.reviewerProfile.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
        availability: index === 0 ? "Busy" : "Available",
        weeklyCapacityHours: user.role === "CONSULTANT" ? 30 : 20,
      },
    });

    for (const skill of reviewTypes.slice(0, index + 3)) {
      await prisma.reviewerSkill.upsert({
        where: {
          reviewerProfileId_skill: {
            reviewerProfileId: profile.id,
            skill,
          },
        },
        update: {},
        create: {
          reviewerProfileId: profile.id,
          skill,
          level: index === 0 ? "Advanced" : "Intermediate",
        },
      });
    }
  }

  for (const [index, project] of projects.entries()) {
    const sprId = project.sprId ?? `SPR-${pad(index + 1)}`;

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        sprId,
        riskTier: project.riskTier ?? (index % 2 === 0 ? "High" : "Medium"),
        businessOwner: project.businessOwner ?? project.client ?? "Product",
        technicalOwner: project.technicalOwner ?? "Engineering",
      },
    });

    const component = await prisma.component.upsert({
      where: {
        id: `component-${project.id}`,
      },
      update: {},
      create: {
        id: `component-${project.id}`,
        projectId: project.id,
        name: `${project.name} Application`,
        type: "APPLICATION",
        criticality: index % 2 === 0 ? "High" : "Medium",
      },
    });

    const scopeProfile = await prisma.scopeProfile.upsert({
      where: {
        id: `scope-${project.id}`,
      },
      update: {},
      create: {
        id: `scope-${project.id}`,
        projectId: project.id,
        name: `${sprId} Baseline Scope`,
        riskProfile: index % 2 === 0 ? "Internet-facing high-risk app" : "Standard application review",
        businessCriticality: index % 2 === 0 ? "High" : "Medium",
        dataClassification: index % 2 === 0 ? "Confidential" : "Internal",
        internetFacing: index % 2 === 0,
        authRequired: true,
      },
    });

    for (const type of reviewTypes) {
      await prisma.requiredReviewType.upsert({
        where: {
          id: `required-${scopeProfile.id}-${type}`,
        },
        update: {},
        create: {
          id: `required-${scopeProfile.id}-${type}`,
          scopeProfileId: scopeProfile.id,
          type,
          required: type !== "MSB" || index % 2 === 0,
          reason:
            type === "MSB"
              ? "Required for high-risk architecture and service boundary review"
              : `${type} workstream included in baseline scope`,
        },
      });
    }

    await prisma.scopeItem.upsert({
      where: {
        id: `scope-item-${project.id}`,
      },
      update: {},
      create: {
        id: `scope-item-${project.id}`,
        scopeProfileId: scopeProfile.id,
        componentId: component.id,
        name: `${project.name} primary app`,
        type: "APPLICATION",
        value: project.client ?? project.name,
        inScope: true,
      },
    });

    const review = await prisma.securityReview.upsert({
      where: {
        id: `review-${project.id}`,
      },
      update: {},
      create: {
        id: `review-${project.id}`,
        srId: `SR-${pad(index + 1)}-${new Date().getFullYear()}`,
        projectId: project.id,
        scopeProfileId: scopeProfile.id,
        title: `${project.name} recurring pentest`,
        type: "PENTEST",
        status: index === 0 ? "In Progress" : "Requested",
        priority: index % 2 === 0 ? "High" : "Medium",
        requestedStartDate: new Date(),
        dueDate: new Date(Date.now() + (14 + index * 3) * 24 * 60 * 60 * 1000),
      },
    });

    for (const type of reviewTypes.filter((type) => type !== "MSB" || index % 2 === 0)) {
      await prisma.reviewWorkstream.upsert({
        where: {
          id: `workstream-${review.id}-${type}`,
        },
        update: {},
        create: {
          id: `workstream-${review.id}-${type}`,
          reviewId: review.id,
          type,
          status: index === 0 ? "In Progress" : "Not Started",
          required: true,
        },
      });
    }

    const reviewer = reviewers[index % Math.max(reviewers.length, 1)];
    if (reviewer) {
      const reviewerProfile = await prisma.reviewerProfile.findUnique({
        where: {
          userId: reviewer.id,
        },
      });

      await prisma.reviewerAssignment.upsert({
        where: {
          id: `assignment-${review.id}-${reviewer.id}`,
        },
        update: {},
        create: {
          id: `assignment-${review.id}-${reviewer.id}`,
          reviewId: review.id,
          reviewerProfileId: reviewerProfile?.id,
          userId: reviewer.id,
          role: "Primary",
          status: index === 0 ? "In Progress" : "Assigned",
          allocatedHours: index === 0 ? 18 : 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + (14 + index * 3) * 24 * 60 * 60 * 1000),
        },
      });
    }

    await prisma.finding.updateMany({
      where: {
        projectId: project.id,
        reviewId: null,
      },
      data: {
        reviewId: review.id,
        componentId: component.id,
      },
    });
  }

  console.log(`Backfilled ${projects.length} SPR/SR records`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

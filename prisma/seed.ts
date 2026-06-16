import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function createUser(
  name: string,
  email: string,
  role: Role
) {
  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
      },
    });

    console.log(`Created ${email}`);
    return user;
  } else {
    console.log(`${email} already exists`);
    return existing;
  }
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function ensureReviewerProfile(
  userId: string,
  availability: string,
  weeklyCapacityHours: number,
  skills: string[]
) {
  const profile = await prisma.reviewerProfile.upsert({
    where: {
      userId,
    },
    update: {
      availability,
      weeklyCapacityHours,
    },
    create: {
      userId,
      availability,
      weeklyCapacityHours,
    },
  });

  await prisma.reviewerSkill.deleteMany({
    where: {
      reviewerProfileId: profile.id,
    },
  });

  await prisma.reviewerSkill.createMany({
    data: skills.map((skill) => ({
      reviewerProfileId: profile.id,
      skill,
      level: "Advanced",
    })),
  });

  return profile;
}

type DemoReview = {
  srId: string;
  title: string;
  status: string;
  priority: string;
  requestedOffset: number;
  actualOffset?: number;
  dueOffset: number;
  reviewer: number | null;
  hours: number;
  extension?: {
    days: number;
    reason: string;
    status?: string;
  };
  cancellation?: {
    reason: string;
    status?: string;
  };
};

type DemoProject = {
  sprId: string;
  name: string;
  client: string;
  status: string;
  riskTier: string;
  businessOwner: string;
  technicalOwner: string;
  summary: string;
  reviews: DemoReview[];
  findings: {
    title: string;
    severity: string;
    status: string;
    source: string;
    dueOffset: number;
  }[];
};

async function seedPortfolio(
  projects: DemoProject[],
  reviewerProfiles: { id: string; userId: string }[]
) {
  for (const item of projects) {
    const project = await prisma.project.upsert({
      where: {
        sprId: item.sprId,
      },
      update: {
        name: item.name,
        client: item.client,
        status: item.status,
        riskTier: item.riskTier,
        businessOwner: item.businessOwner,
        technicalOwner: item.technicalOwner,
        executiveSummary: item.summary,
      },
      create: {
        sprId: item.sprId,
        name: item.name,
        client: item.client,
        status: item.status,
        riskTier: item.riskTier,
        businessOwner: item.businessOwner,
        technicalOwner: item.technicalOwner,
        executiveSummary: item.summary,
      },
    });

    await prisma.reviewerAssignment.deleteMany({
      where: {
        review: {
          projectId: project.id,
        },
      },
    });
    await prisma.reviewExtension.deleteMany({
      where: {
        review: {
          projectId: project.id,
        },
      },
    });
    await prisma.reviewCancellation.deleteMany({
      where: {
        review: {
          projectId: project.id,
        },
      },
    });
    await prisma.finding.deleteMany({
      where: {
        projectId: project.id,
      },
    });
    await prisma.securityReview.deleteMany({
      where: {
        projectId: project.id,
      },
    });

    const createdReviews = [];

    for (const review of item.reviews) {
      const createdReview =
        await prisma.securityReview.create({
          data: {
            projectId: project.id,
            srId: review.srId,
            title: review.title,
            status: review.status,
            priority: review.priority,
            requestedStartDate: daysFromNow(
              review.requestedOffset
            ),
            actualStartDate:
              review.actualOffset === undefined
                ? undefined
                : daysFromNow(review.actualOffset),
            dueDate: daysFromNow(review.dueOffset),
            completedAt:
              review.status === "Completed"
                ? daysFromNow(-2)
                : undefined,
            cancelledAt:
              review.status === "Cancelled"
                ? daysFromNow(-1)
                : undefined,
          },
        });

      createdReviews.push(createdReview);

      if (review.reviewer !== null) {
        const reviewerProfile =
          reviewerProfiles[review.reviewer % reviewerProfiles.length];

        await prisma.reviewerAssignment.create({
          data: {
            reviewId: createdReview.id,
            reviewerProfileId: reviewerProfile.id,
            userId: reviewerProfile.userId,
            role: "Primary",
            status:
              review.status === "Completed"
                ? "Completed"
                : "Assigned",
            allocatedHours: review.hours,
            startDate: daysFromNow(review.actualOffset ?? review.requestedOffset),
            endDate:
              review.status === "Completed"
                ? daysFromNow(-2)
                : undefined,
          },
        });
      }

      if (review.extension) {
        await prisma.reviewExtension.create({
          data: {
            reviewId: createdReview.id,
            requestedUntil: daysFromNow(review.extension.days),
            reason: review.extension.reason,
            status: review.extension.status ?? "Requested",
          },
        });
      }

      if (review.cancellation) {
        await prisma.reviewCancellation.create({
          data: {
            reviewId: createdReview.id,
            reason: review.cancellation.reason,
            status: review.cancellation.status ?? "Requested",
          },
        });
      }
    }

    for (const finding of item.findings) {
      await prisma.finding.create({
        data: {
          projectId: project.id,
          reviewId: createdReviews[0]?.id,
          title: finding.title,
          severity: finding.severity,
          status: finding.status,
          source: finding.source,
          dueDate: daysFromNow(finding.dueOffset),
          description: `${finding.title} identified during seed portfolio review.`,
          remediation:
            "Track owner response, validate remediation evidence, and close after reviewer verification.",
        },
      });
    }

    console.log(`Seeded ${item.sprId} · ${item.name}`);
  }
}

async function main() {
  const admin = await createUser(
    "Admin",
    "admin@atomix.ai",
    "ADMIN"
  );

  const governance = await createUser(
    "Governance Lead",
    "governance@atomix.ai",
    "GOVERNANCE_TEAM"
  );

  const qa = await createUser(
    "QA Reviewer",
    "qa@atomix.ai",
    "QA_REVIEWER"
  );

  const reviewer = await createUser(
    "Reviewer",
    "reviewer@atomix.ai",
    "REVIEWER"
  );

  const executive = await createUser(
    "Executive",
    "executive@atomix.ai",
    "EXECUTIVE"
  );

  const engagementManager = await createUser(
    "Engagement Manager",
    "em@atomix.ai",
    "ENGAGEMENT_MANAGER"
  );

  await createUser(
    "Consultant",
    "consultant@atomix.ai",
    "CONSULTANT"
  );

  const reviewerProfiles = await Promise.all([
    ensureReviewerProfile(governance.id, "Available", 32, [
      "Governance",
      "API",
      "Cloud",
    ]),
    ensureReviewerProfile(qa.id, "Available", 28, [
      "Peer Review",
      "Web",
      "Mobile",
    ]),
    ensureReviewerProfile(reviewer.id, "Limited", 24, [
      "Web",
      "API",
      "Threat Modeling",
    ]),
    ensureReviewerProfile(engagementManager.id, "Available", 30, [
      "Delivery",
      "Client Coordination",
      "Scope",
    ]),
    ensureReviewerProfile(admin.id, "Reserved", 20, [
      "Escalation",
      "Executive Reporting",
      "Platform",
    ]),
  ]);

  await seedPortfolio(
    [
      {
        sprId: "SPR-9001",
        name: "Customer Portal",
        client: "Retail Banking",
        status: "Active",
        riskTier: "High",
        businessOwner: "Neha Rao",
        technicalOwner: "Platform Engineering",
        summary:
          "Internet-facing customer portal with active web and API review work.",
        reviews: [
          {
            srId: "SR-9001-2026",
            title: "Portal Web App Review",
            status: "In Progress",
            priority: "High",
            requestedOffset: -10,
            actualOffset: -7,
            dueOffset: -1,
            reviewer: 1,
            hours: 34,
            extension: {
              days: 5,
              reason:
                "Additional retest window required after authentication changes.",
            },
          },
        ],
        findings: [
          {
            title: "SSRF in PDF Generator",
            severity: "Critical",
            status: "Open",
            source: "Burp Suite",
            dueOffset: 3,
          },
        ],
      },
      {
        sprId: "SPR-9002",
        name: "Payments API",
        client: "Payments",
        status: "Active",
        riskTier: "High",
        businessOwner: "Arjun Mehta",
        technicalOwner: "API Platform",
        summary:
          "High-throughput public API review with crypto and auth coverage.",
        reviews: [
          {
            srId: "SR-9002-2026",
            title: "Payments API Review",
            status: "Assigned",
            priority: "High",
            requestedOffset: -4,
            actualOffset: -2,
            dueOffset: 7,
            reviewer: 2,
            hours: 22,
          },
        ],
        findings: [
          {
            title: "Weak idempotency handling",
            severity: "High",
            status: "In Remediation",
            source: "Manual Review",
            dueOffset: 8,
          },
        ],
      },
      {
        sprId: "SPR-9003",
        name: "Mobile Banking API",
        client: "Digital Channels",
        status: "Active",
        riskTier: "High",
        businessOwner: "Priya Shah",
        technicalOwner: "Mobile Backend",
        summary:
          "Mobile backend review with identity, session, and API control testing.",
        reviews: [
          {
            srId: "SR-9003-2026",
            title: "Mobile API Security Review",
            status: "Scheduled",
            priority: "High",
            requestedOffset: -3,
            actualOffset: 2,
            dueOffset: 14,
            reviewer: null,
            hours: 0,
          },
        ],
        findings: [],
      },
      {
        sprId: "SPR-9004",
        name: "Admin Console",
        client: "Internal Operations",
        status: "Active",
        riskTier: "Medium",
        businessOwner: "Operations",
        technicalOwner: "IAM Team",
        summary:
          "Privileged workflow review with strong emphasis on role separation.",
        reviews: [
          {
            srId: "SR-9004-2026",
            title: "Admin Console Pentest",
            status: "In Progress",
            priority: "Medium",
            requestedOffset: -12,
            actualOffset: -12,
            dueOffset: 2,
            reviewer: 0,
            hours: 18,
          },
        ],
        findings: [
          {
            title: "Excessive admin permission path",
            severity: "Medium",
            status: "Open",
            source: "Manual Review",
            dueOffset: 12,
          },
        ],
      },
      {
        sprId: "SPR-9005",
        name: "Data Lake Ingestion",
        client: "Analytics",
        status: "Active",
        riskTier: "Medium",
        businessOwner: "Analytics Office",
        technicalOwner: "Data Platform",
        summary:
          "Ingestion service review covering file parsing and tenant separation.",
        reviews: [
          {
            srId: "SR-9005-2026",
            title: "Data Ingestion Review",
            status: "In Progress",
            priority: "Medium",
            requestedOffset: -8,
            actualOffset: -6,
            dueOffset: -2,
            reviewer: 3,
            hours: 16,
            extension: {
              days: 4,
              reason:
                "Vendor package evidence arrived after planned review start.",
            },
          },
        ],
        findings: [],
      },
      {
        sprId: "SPR-9006",
        name: "Vendor Claims Platform",
        client: "Claims",
        status: "Active",
        riskTier: "Medium",
        businessOwner: "Claims Tech",
        technicalOwner: "Vendor Integration",
        summary:
          "Third-party workflow review pending final vendor access package.",
        reviews: [
          {
            srId: "SR-9006-2026",
            title: "Vendor Web Review",
            status: "Requested",
            priority: "Medium",
            requestedOffset: 1,
            dueOffset: 15,
            reviewer: null,
            hours: 0,
          },
        ],
        findings: [],
      },
      {
        sprId: "SPR-9007",
        name: "HR Benefits Portal",
        client: "People Systems",
        status: "Completed",
        riskTier: "Low",
        businessOwner: "People Ops",
        technicalOwner: "Enterprise Apps",
        summary:
          "Completed employee portal review retained for executive trend history.",
        reviews: [
          {
            srId: "SR-9007-2026",
            title: "Benefits Portal Review",
            status: "Completed",
            priority: "Low",
            requestedOffset: -20,
            actualOffset: -20,
            dueOffset: -5,
            reviewer: 1,
            hours: 20,
          },
        ],
        findings: [
          {
            title: "Missing secure cookie flag",
            severity: "Low",
            status: "Closed",
            source: "Burp Suite",
            dueOffset: -3,
          },
        ],
      },
      {
        sprId: "SPR-9008",
        name: "Trading Analytics",
        client: "Markets",
        status: "Active",
        riskTier: "High",
        businessOwner: "Markets Tech",
        technicalOwner: "Quant Platform",
        summary:
          "Analytics workflow review covering sensitive data transformation.",
        reviews: [
          {
            srId: "SR-9008-2026",
            title: "Trading Analytics Threat Review",
            status: "Active",
            priority: "High",
            requestedOffset: -5,
            actualOffset: -1,
            dueOffset: 4,
            reviewer: 4,
            hours: 28,
          },
        ],
        findings: [
          {
            title: "Insufficient audit trail coverage",
            severity: "High",
            status: "Open",
            source: "Checkmarx",
            dueOffset: 6,
          },
        ],
      },
      {
        sprId: "SPR-9009",
        name: "Legacy CRM",
        client: "Sales Operations",
        status: "Cancelled",
        riskTier: "Medium",
        businessOwner: "Sales Ops",
        technicalOwner: "CRM Team",
        summary:
          "Canceled review after migration timeline changed.",
        reviews: [
          {
            srId: "SR-9009-2026",
            title: "Legacy CRM Review",
            status: "Cancelled",
            priority: "Medium",
            requestedOffset: -9,
            actualOffset: -8,
            dueOffset: 5,
            reviewer: 2,
            hours: 8,
            cancellation: {
              reason:
                "Application retirement moved ahead of planned execution.",
              status: "Approved",
            },
          },
        ],
        findings: [],
      },
      {
        sprId: "SPR-9010",
        name: "Cloud Control Plane",
        client: "Infrastructure",
        status: "Active",
        riskTier: "Critical",
        businessOwner: "Cloud Office",
        technicalOwner: "Cloud Security",
        summary:
          "Control plane review covering privileged service workflows.",
        reviews: [
          {
            srId: "SR-9010-2026",
            title: "Cloud Control Plane Review",
            status: "In Progress",
            priority: "Critical",
            requestedOffset: -14,
            actualOffset: -10,
            dueOffset: -3,
            reviewer: 0,
            hours: 42,
            extension: {
              days: 7,
              reason:
                "Additional service account evidence required for closure.",
            },
          },
        ],
        findings: [
          {
            title: "Privileged service account key rotation gap",
            severity: "Critical",
            status: "Open",
            source: "AquaSec",
            dueOffset: 2,
          },
        ],
      },
    ],
    reviewerProfiles
  );

  await prisma.appSession.upsert({
    where: {
      id: "seed-current-session",
    },
    update: {
      currentUserId: executive.id,
    },
    create: {
      id: "seed-current-session",
      currentUserId: executive.id,
    },
  });
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

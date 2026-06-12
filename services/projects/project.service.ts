//import { prisma } from "@/lib/prisma";
import { prisma } from "../../lib/prisma";
export async function getProjects() {
  return prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createProject(
  name: string,
  client?: string
) {
  return prisma.project.create({
    data: {
      name,
      client,
    },
  });
}
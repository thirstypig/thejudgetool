"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireAuth, requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import {
  KCBS_MANDATORY_CATEGORIES,
  CATEGORY_STATUS,
} from "@/shared/constants/kcbs";
import { competitionSchema } from "../schemas";
import { competitionByIdInclude } from "../types";
import type { CompetitionWithRelations } from "../types";

// --- Create Competition ---

export async function createCompetition(data: {
  name: string;
  date: string;
  location: string;
  organizerName: string;
  optionalCategories?: string[];
}) {
  await requireOrganizer();
  const parsed = competitionSchema.parse(data);

  const allCategories = [
    ...KCBS_MANDATORY_CATEGORIES.map((cat) => ({
      categoryName: cat.name,
      categoryType: cat.type,
      order: cat.order,
      status: CATEGORY_STATUS.PENDING,
    })),
    ...(parsed.optionalCategories || []).map((name, idx) => ({
      categoryName: name,
      categoryType: "OPTIONAL",
      order: KCBS_MANDATORY_CATEGORIES.length + idx + 1,
      status: CATEGORY_STATUS.PENDING,
    })),
  ];

  const competition = await prisma.competition.create({
    data: {
      name: parsed.name,
      date: new Date(parsed.date + "T00:00:00"),
      location: parsed.location,
      organizerName: parsed.organizerName,
      categoryRounds: {
        create: allCategories,
      },
    },
  });

  revalidatePath("/organizer");
  return competition;
}

// --- Get Competitions ---

export async function getCompetitions() {
  await requireAuth();
  const competitions = await prisma.competition.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { competitors: true, tables: true },
      },
      categoryRounds: { orderBy: { order: "asc" } },
    },
  });
  return competitions;
}

// --- Get Competition By ID ---

export async function getCompetitionById(
  id: string
): Promise<CompetitionWithRelations | null> {
  await requireAuth();
  return prisma.competition.findUnique({
    where: { id },
    include: competitionByIdInclude,
  });
}

"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { competitorSchema } from "../schemas";

// --- Add Competitor ---

export async function addCompetitor(
  competitionId: string,
  data: { teamName: string; anonymousNumber: string; headCookName?: string; headCookKcbsNumber?: string }
) {
  await requireOrganizer();
  // Verify competition exists (prevents writing to unknown competitions)
  await prisma.competition.findUniqueOrThrow({ where: { id: competitionId } });
  const parsed = competitorSchema.parse(data);

  const existing = await prisma.competitor.findUnique({
    where: {
      competitionId_anonymousNumber: {
        competitionId,
        anonymousNumber: parsed.anonymousNumber,
      },
    },
  });
  if (existing) {
    throw new Error(
      `Anonymous number ${parsed.anonymousNumber} is already in use`
    );
  }

  const competitor = await prisma.competitor.create({
    data: {
      competitionId,
      teamName: parsed.teamName,
      anonymousNumber: parsed.anonymousNumber,
      headCookName: parsed.headCookName || null,
      headCookKcbsNumber: parsed.headCookKcbsNumber || null,
    },
  });

  revalidatePath(`/organizer/${competitionId}/teams`);
  return competitor;
}

// --- Add Competitors Bulk (CSV import) ---

const bulkCompetitorSchema = z.array(competitorSchema).min(1).max(200);

export async function addCompetitorsBulk(
  competitionId: string,
  teams: { anonymousNumber: string; teamName: string; headCookName?: string; headCookKcbsNumber?: string }[]
) {
  await requireOrganizer();
  // Verify competition exists (prevents writing to unknown competitions)
  await prisma.competition.findUniqueOrThrow({ where: { id: competitionId } });

  const parsed = bulkCompetitorSchema.parse(teams);

  const beforeCount = await prisma.competitor.count({ where: { competitionId } });

  await prisma.competitor.createMany({
    data: parsed.map((t) => ({
      competitionId,
      teamName: t.teamName,
      anonymousNumber: t.anonymousNumber,
      headCookName: t.headCookName || null,
      headCookKcbsNumber: t.headCookKcbsNumber || null,
    })),
    skipDuplicates: true,
  });

  const afterCount = await prisma.competitor.count({ where: { competitionId } });
  const added = afterCount - beforeCount;
  const skipped = parsed.length - added;

  revalidatePath(`/organizer/${competitionId}/teams`);
  return { added, skipped };
}

// --- Check In Team ---

export async function checkInTeam(competitorId: string) {
  await requireOrganizer();

  // Verify competitor exists (prevents blind IDOR)
  const competitor = await prisma.competitor.findUniqueOrThrow({
    where: { id: competitorId },
    select: { competitionId: true },
  });

  await prisma.competitor.update({
    where: { id: competitorId },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  revalidatePath(`/organizer/${competitor.competitionId}`);
}

// --- Uncheck In Team ---

export async function uncheckInTeam(competitorId: string) {
  await requireOrganizer();

  // Verify competitor exists (prevents blind IDOR)
  const competitor = await prisma.competitor.findUniqueOrThrow({
    where: { id: competitorId },
    select: { competitionId: true },
  });

  await prisma.competitor.update({
    where: { id: competitorId },
    data: { checkedIn: false, checkedInAt: null },
  });

  revalidatePath(`/organizer/${competitor.competitionId}`);
}

"use server";

import { prisma } from "@/shared/lib/prisma";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { importJudgeSchema } from "../schemas";
import type { ImportResult } from "../types";

async function requireOrganizer() {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ORGANIZER") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function importSingleJudge(data: {
  cbjNumber: string;
  name: string;
}) {
  await requireOrganizer();
  const parsed = importJudgeSchema.parse(data);

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { cbjNumber: parsed.cbjNumber },
  });
  if (existing) {
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      cbjNumber: parsed.cbjNumber,
      name: parsed.name,
      email: `cbj-${parsed.cbjNumber}@judge.local`,
      role: "JUDGE",
      pin: "",
    },
  });

  return user;
}

// --- Search Judges (CBJ Directory) ---

export async function searchJudges(query: string) {
  await requireOrganizer();

  if (!query || query.trim().length < 1) return [];

  const trimmed = query.trim();

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["JUDGE", "TABLE_CAPTAIN"] },
      OR: [
        { cbjNumber: { contains: trimmed, mode: "insensitive" } },
        { name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      cbjNumber: true,
      name: true,
      role: true,
    },
    orderBy: { cbjNumber: "asc" },
    take: 20,
  });

  return users;
}

export async function importJudgesBulk(raw: string): Promise<ImportResult> {
  await requireOrganizer();

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: ImportResult = { created: 0, existing: 0, userIds: [], errors: [] };

  for (const line of lines) {
    // Support comma or tab separated: "123, John Smith" or "123\tJohn Smith"
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    if (parts.length < 2) {
      result.errors.push({
        cbjNumber: line,
        error: "Invalid format. Expected: CBJ#, Name",
      });
      continue;
    }

    const cbjNumber = parts[0].replace(/^CBJ-/i, "").trim();
    const name = parts.slice(1).join(", ").trim();

    try {
      const parsed = importJudgeSchema.parse({ cbjNumber, name });
      const existing = await prisma.user.findUnique({
        where: { cbjNumber: parsed.cbjNumber },
      });

      if (existing) {
        result.existing++;
        result.userIds.push(existing.id);
      } else {
        const user = await prisma.user.create({
          data: {
            cbjNumber: parsed.cbjNumber,
            name: parsed.name,
            email: `cbj-${parsed.cbjNumber}@judge.local`,
            role: "JUDGE",
            pin: "",
          },
        });
        result.created++;
        result.userIds.push(user.id);
      }
    } catch (err) {
      result.errors.push({
        cbjNumber,
        error: err instanceof Error ? err.message : "Failed to import",
      });
    }
  }

  return result;
}

import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";

/**
 * Shared auth guard helpers for server actions.
 * All features import from here instead of defining their own.
 */

/** Returns the authenticated session or throws. Any role. */
export async function requireAuth(): Promise<Session> {
  const session = (await auth()) as Session | null;
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Returns the authenticated session. Throws if not ORGANIZER. */
export async function requireOrganizer(): Promise<Session> {
  const session = await requireAuth();
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "ORGANIZER") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Returns session + cbjNumber + userId. Throws if not JUDGE or TABLE_CAPTAIN. */
export async function requireJudge(): Promise<{
  session: Session;
  cbjNumber: string;
  userId: string;
}> {
  const session = await requireAuth();
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "JUDGE" && role !== "TABLE_CAPTAIN") {
    throw new Error("Unauthorized: must be a judge");
  }
  const cbjNumber = (session.user as { cbjNumber?: string }).cbjNumber;
  if (!cbjNumber) throw new Error("Unauthorized: missing CBJ number");
  const userId = (session.user as { id: string }).id;
  return { session, cbjNumber, userId };
}

/** Returns session + cbjNumber + userId. Throws if not TABLE_CAPTAIN or ORGANIZER. */
export async function requireCaptain(): Promise<{
  session: Session;
  cbjNumber: string | undefined;
  userId: string;
}> {
  const session = await requireAuth();
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "TABLE_CAPTAIN" && role !== "ORGANIZER") {
    throw new Error("Unauthorized: must be a table captain");
  }
  const cbjNumber = (session.user as { cbjNumber?: string }).cbjNumber;
  const userId = (session.user as { id: string }).id;
  return { session, cbjNumber, userId };
}

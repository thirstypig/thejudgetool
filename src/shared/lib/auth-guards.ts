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
  if (session.user.role !== "ORGANIZER") {
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
  if (session.user.role !== "JUDGE" && session.user.role !== "TABLE_CAPTAIN") {
    throw new Error("Unauthorized: must be a judge");
  }
  if (!session.user.cbjNumber) throw new Error("Unauthorized: missing CBJ number");
  return { session, cbjNumber: session.user.cbjNumber!, userId: session.user.id! };
}

/** Returns session + cbjNumber + userId. Throws if not TABLE_CAPTAIN or ORGANIZER. */
export async function requireCaptain(): Promise<{
  session: Session;
  cbjNumber: string | undefined;
  userId: string;
}> {
  const session = await requireAuth();
  if (session.user.role !== "TABLE_CAPTAIN" && session.user.role !== "ORGANIZER") {
    throw new Error("Unauthorized: must be a table captain");
  }
  return {
    session,
    cbjNumber: session.user.cbjNumber ?? undefined,
    userId: session.user.id!,
  };
}

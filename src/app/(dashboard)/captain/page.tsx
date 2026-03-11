import type { Metadata } from "next";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { CaptainDashboardClient } from "./CaptainDashboardClient";

export const metadata: Metadata = {
  title: "My Table | The Judge Tool",
};

export default async function CaptainPage() {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const cbjNumber = (session?.user as { cbjNumber?: string } | undefined)
    ?.cbjNumber;

  if (!session?.user || (role !== "TABLE_CAPTAIN" && role !== "ORGANIZER")) {
    redirect("/login");
  }
  if (!cbjNumber) redirect("/login");

  return (
    <CaptainDashboardClient
      cbjNumber={cbjNumber}
      captainName={session.user.name ?? cbjNumber}
    />
  );
}

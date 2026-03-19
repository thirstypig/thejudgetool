import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

interface ServiceCheck {
  name: string;
  status: "operational" | "degraded" | "down";
  latencyMs: number;
  detail: string;
}

export async function GET() {
  const checks: ServiceCheck[] = [];

  // --- Database check ---
  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Math.round(performance.now() - dbStart);
    checks.push({
      name: "Database",
      status: dbLatency > 1000 ? "degraded" : "operational",
      latencyMs: dbLatency,
      detail: `PostgreSQL (Supabase) — ${dbLatency}ms round-trip`,
    });
  } catch {
    checks.push({
      name: "Database",
      status: "down",
      latencyMs: -1,
      detail: "PostgreSQL connection failed",
    });
  }

  // --- Auth provider check ---
  // Check auth configuration directly instead of self-referential fetch
  // (fetching own /api/auth/session can fail during cold start)
  {
    const authStart = performance.now();
    const hasSecret = !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET;
    const hasUrl = !!process.env.NEXTAUTH_URL || !!process.env.AUTH_URL;
    const authLatency = Math.round(performance.now() - authStart);
    const configured = hasSecret;
    checks.push({
      name: "Auth Provider",
      status: configured ? "operational" : "degraded",
      latencyMs: authLatency,
      detail: configured
        ? `NextAuth.js v5 (JWT) — configured${hasUrl ? ", URL set" : ""}`
        : "NextAuth.js v5 — missing AUTH_SECRET",
    });
  }

  // --- Model count (DB deeper check) ---
  try {
    const countStart = performance.now();
    const [competitions, users] = await Promise.all([
      prisma.competition.count(),
      prisma.user.count(),
    ]);
    const countLatency = Math.round(performance.now() - countStart);
    checks.push({
      name: "Data Layer",
      status: "operational",
      latencyMs: countLatency,
      detail: `${competitions} competitions, ${users} users in database`,
    });
  } catch {
    checks.push({
      name: "Data Layer",
      status: "down",
      latencyMs: -1,
      detail: "Failed to query data counts",
    });
  }

  const overall = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
      ? "degraded"
      : "operational";

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    checks,
    system: {
      framework: "Next.js 14.2",
      runtime: `Node.js ${process.version}`,
      database: "PostgreSQL (Supabase + Prisma 5)",
      auth: "NextAuth.js v5 (JWT, 24h expiry)",
      cache: "In-memory (resets on deploy)",
      testCount: 113,
      endpointCount: 62,
      models: 12,
    },
  });
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/shared/lib/rate-limit";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "judge-login",
      name: "Judge Login",
      credentials: {
        cbjNumber: { label: "CBJ Number", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        const { cbjNumber: rawCbj, pin } = credentials as {
          cbjNumber: string;
          pin: string;
        };

        const rateLimitKey = `judge:${rawCbj}`;
        checkRateLimit(rateLimitKey);

        // Normalize: strip "CBJ-" prefix, trim whitespace, strip leading zeros
        const stripped = rawCbj.replace(/^CBJ-/i, "").trim();
        // Canonical form: no leading zeros (e.g., "00123" → "123", "0" → "0")
        const normalized = stripped.replace(/^0+/, "") || "0";

        // Single deterministic lookup — no fallback ambiguity
        let user = await prisma.user.findUnique({
          where: { cbjNumber: normalized },
        });
        // Also try exact input if canonical form didn't match (backward compat)
        if (!user && stripped !== normalized) {
          user = await prisma.user.findUnique({
            where: { cbjNumber: stripped },
          });
        }

        if (!user) return null;

        // Check competition shared PIN first
        const competitionReg = await prisma.competitionJudge.findFirst({
          where: { userId: user.id },
          include: { competition: { select: { judgePin: true } } },
          orderBy: { competition: { date: "desc" } },
        });

        const competitionPin = competitionReg?.competition?.judgePin;
        let pinMatch = false;
        if (competitionPin) {
          pinMatch = await bcrypt.compare(pin, competitionPin);
        } else if (user.pin) {
          pinMatch = await bcrypt.compare(pin, user.pin);
        }

        if (!pinMatch) {
          console.warn(`[auth] Failed judge login attempt for CBJ: ${stripped}`);
          return null;
        }

        resetRateLimit(rateLimitKey);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          cbjNumber: user.cbjNumber,
        };
      },
    }),
    Credentials({
      id: "organizer-login",
      name: "Organizer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const rateLimitKey = `organizer:${email}`;
        checkRateLimit(rateLimitKey);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.role !== "ORGANIZER" || !user.pin) {
          console.warn(`[auth] Failed organizer login attempt for: ${email}`);
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.pin);
        if (!passwordMatch) {
          console.warn(`[auth] Failed organizer login attempt for: ${email}`);
          return null;
        }

        resetRateLimit(rateLimitKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          cbjNumber: user.cbjNumber,
        };
      },
    }),
  ],
});

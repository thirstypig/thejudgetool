import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — no Node.js dependencies (no Prisma, no bcrypt).
 * Used by middleware for JWT session checks only.
 * Full auth config with providers is in auth.ts.
 */
export const authConfig = {
  providers: [], // Providers are only needed for sign-in, not session checks
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.cbjNumber = user.cbjNumber;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        (session.user as { role: string }).role = token.role as string;
        (session.user as { cbjNumber: string | null }).cbjNumber =
          token.cbjNumber as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
} satisfies NextAuthConfig;

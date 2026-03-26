import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — no Node.js dependencies (no Prisma, no bcrypt).
 * Used by middleware for JWT session checks only.
 * Full auth config with providers is in auth.ts.
 */
export default {
  providers: [], // Providers are only needed for sign-in, not session checks
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.cbjNumber = (user as unknown as { cbjNumber: string }).cbjNumber;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { cbjNumber: string }).cbjNumber =
          token.cbjNumber as string;
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

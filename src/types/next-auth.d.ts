import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    cbjNumber: string | null;
  }

  interface Session {
    user: {
      role: string;
      cbjNumber: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    cbjNumber: string | null;
  }
}

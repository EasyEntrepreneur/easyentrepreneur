import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
  }

  interface Session {
    user: {
      lastname: string;
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }

  interface JWT {
    id?: string;
    role?: string;
  }
}

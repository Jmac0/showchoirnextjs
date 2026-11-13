// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    // This website login's own id ([...nextauth].ts)
    sid?: string;
    user: {
      // The user's role, eg admin/user
      role: string;
      name: string;
      email: string;
    };
  }

  interface User {
    role: string;
  }
}

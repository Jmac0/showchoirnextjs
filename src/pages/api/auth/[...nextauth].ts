import bcrypt from "bcrypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import dbConnect from "@/src/lib/dbConnect";
import {
  clearLoginFailures,
  ipFrom,
  isLoginBlocked,
  recordLoginFailure,
  TOO_MANY_ATTEMPTS,
} from "@/src/lib/loginLimiter";

import Members from "../../../lib/models/member";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials, req) {
        await dbConnect();
        const { email: rawEmail, password } = (credentials || {}) as {
          email?: unknown;
          password?: unknown;
        };
        // Plain text only, so nothing but an email can reach the database
        // query (a crafted login could otherwise match "any member")
        if (typeof rawEmail !== "string" || typeof password !== "string") {
          return null;
        }
        const email = rawEmail.toLowerCase().trim();
        const ip = ipFrom(req?.headers);

        // Too many wrong passwords recently (lib/loginLimiter.ts) - the
        // login form shows this message
        if (await isLoginBlocked(email, ip)) {
          throw new Error(TOO_MANY_ATTEMPTS);
        }

        // find user from db
        const user = await Members.findOne({ email }).select("+password");
        // compare hashed DB password with user submitted password
        if (
          !user ||
          !user.password ||
          !(await bcrypt.compare(password, user.password))
        ) {
          await recordLoginFailure(email, ip);
          return null;
        }
        await clearLoginFailures(email);
        // if everything is fine return values from user object
        return {
          id: user._id,
          name: user.first_name,
          email: user.email,
          role: `${user.role || ""}`,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    // error: '/auth/error',
    // signOut: '/auth/signout'
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        // add role to token
        // eslint-disable-next-line no-param-reassign
        token.role = user.role;
      }
      return token;
    },

    session({ session, token }) {
      // Send role properties to the client in session
      if (session.user) {
        // eslint-disable-next-line no-param-reassign
        session.user.role = token.role as string;
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);

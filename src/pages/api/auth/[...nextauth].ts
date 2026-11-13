import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "node:crypto";

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
    // Runs whenever the website login is read. Ends it (by throwing - NextAuth
    // then clears the cookie, so they're logged out) if the member's been
    // deleted, or their password has been changed or reset since they
    // logged in here - unless it was changed from this login. Checked at most
    // once a minute, to save a database look-up on every page.
    async jwt({ token, user, account }) {
      /* eslint-disable no-param-reassign */
      if (account) {
        // add role to token
        token.role = user.role;
        // This login's own id, and when it started
        token.sid = crypto.randomUUID();
        token.signed_in_at = Date.now();
        token.checked_at = Date.now();
        return token;
      }
      // Logged in before these checks existed: we don't know when, so as
      // if long ago - any password change since ends it
      if (typeof token.signed_in_at !== "number") {
        token.sid = crypto.randomUUID();
        token.signed_in_at = 0;
        token.checked_at = 0;
      }
      if (Date.now() - ((token.checked_at as number) || 0) > 60_000) {
        let member;
        try {
          await dbConnect();
          // By id (sub), not email - the email can be changed while logged in
          member = await Members.findOne(
            isValidObjectId(token.sub)
              ? { _id: token.sub }
              : { email: token.email }
          )
            .select("password_changed_at password_changed_by")
            .lean<{
              password_changed_at?: Date;
              password_changed_by?: string;
            }>();
        } catch (error) {
          // The database didn't answer - not a reason to log anyone out.
          // Checked again on the next request.
          // eslint-disable-next-line no-console
          console.error(
            "Couldn't check website login:",
            (error as Error).message
          );
          return token;
        }
        if (!member) throw new Error("Account no longer exists - logged out");
        const changedAt = member.password_changed_at
          ? new Date(member.password_changed_at).getTime()
          : 0;
        if (
          changedAt > (token.signed_in_at as number) &&
          member.password_changed_by !== token.sid
        ) {
          throw new Error("Password changed since this login - logged out");
        }
        token.checked_at = Date.now();
      }
      return token;
      /* eslint-enable no-param-reassign */
    },

    session({ session, token }) {
      // Send role properties to the client in session
      if (session.user) {
        // eslint-disable-next-line no-param-reassign
        session.user.role = token.role as string;
      }
      // This login's id, so changing the password from it keeps it logged
      // in (api/members/change-password.ts)
      // eslint-disable-next-line no-param-reassign
      session.sid = token.sid as string;

      return session;
    },
  },
};

export default NextAuth(authOptions);

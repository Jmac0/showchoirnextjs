import bcrypt from "bcrypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import dbConnect from "@/src/lib/dbConnect";

import Members from "../../../lib/models/member";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials) {
        await dbConnect();
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        // find user from db
        const user = await Members.findOne({ email }).select("+password");
        // compare hashed DB password with user submitted password
        if (
          !user ||
          !user.password ||
          !bcrypt.compareSync(password, user.password)
        )
          return null;
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

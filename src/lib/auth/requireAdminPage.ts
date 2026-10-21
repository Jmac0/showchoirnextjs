import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// For the admin pages' getServerSideProps - the page version of
// requireAdmin.ts. Checks the member's CURRENT role in the database, so
// nobody else ever gets the page. Returns null for an admin (carry on), or
// the redirect to return: sign-in if logged out, the dashboard if not admin.
export async function requireAdminPage(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.email) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
  }

  await dbConnect();
  const member = await Members.findOne({ email: session.user.email });
  if (member?.role !== "admin") {
    return {
      redirect: { destination: "/members/dashboard", permanent: false },
    };
  }
  return null;
}

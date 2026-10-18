import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import React from "react";

import { HolidaysAdmin } from "@/src/components/members/HolidaysAdmin";
import MemberNav from "@/src/components/Navigation/MemberNav";
import dbConnect from "@/src/lib/dbConnect";
import { listHolidays } from "@/src/lib/holidays";
import { HolidayRow } from "@/src/lib/holidaysShared";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// Holidays admin page - the breaks with no rehearsals, shown on the Book a
// taster form while they're on. Linked from the members menu for admins only.
export default function HolidaysPage({ holidays }: { holidays: HolidayRow[] }) {
  return (
    <div className="fixed top-0 m-0 flex w-full p-0">
      <Head>
        <title>Holidays</title>
      </Head>
      <MemberNav />
      {/* Scrolls itself - the page around it is fixed, like the dashboard */}
      <section className="flex h-screen w-full flex-col items-center overflow-y-auto px-4 pb-24 pt-10 md:px-10">
        <h1 className="mb-6 text-center">Holidays</h1>
        <HolidaysAdmin initialHolidays={holidays} />
      </section>
    </div>
  );
}

// Admins only - checked here on the server (like music-admin.tsx)
export async function getServerSideProps(context: GetServerSidePropsContext) {
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

  return { props: { holidays: await listHolidays() } };
}

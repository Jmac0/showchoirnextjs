import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import React from "react";

import { MusicAdmin } from "@/src/components/members/MusicAdmin";
import MemberNav from "@/src/components/Navigation/MemberNav";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import Songs from "@/src/lib/models/song";
import { toAdminSong } from "@/src/lib/music";
import { AdminSong } from "@/src/lib/musicShared";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// Music & Lyrics admin page - admins add songs and upload their part
// tracks, lyrics and sheet music (files go to R2, details to MongoDB).
// Linked from the members menu for admins only.
export default function MusicAdminPage({ songs }: { songs: AdminSong[] }) {
  return (
    <div className="fixed top-0 m-0 flex w-full p-0">
      <Head>
        <title>Music admin</title>
      </Head>
      <MemberNav />
      {/* Scrolls itself - the page around it is fixed, like the dashboard */}
      <section className="flex h-screen w-full flex-col items-center overflow-y-auto px-4 pb-24 pt-10 md:px-10">
        <h1 className="mb-6 text-center">Music admin</h1>
        <MusicAdmin initialSongs={songs} />
      </section>
    </div>
  );
}

// Admins only - checked here on the server, so nobody else ever gets the
// page. Uses the member's current role in the database.
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

  const songs = await Songs.find()
    .collation({ locale: "en", strength: 2 })
    .sort({ title: 1 })
    .lean();
  return { props: { songs: songs.map(toAdminSong) } };
}

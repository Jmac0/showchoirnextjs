import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { MusicAdmin } from "@/src/components/members/MusicAdmin";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import Songs from "@/src/lib/models/song";
import { toAdminSong } from "@/src/lib/music";
import { AdminSong } from "@/src/lib/musicShared";

// Music & Lyrics admin page - admins add songs and upload their part
// tracks, lyrics and sheet music (files go to R2, details to MongoDB).
// Opened from the admin ribbon (admins only).
export default function MusicAdminPage({ songs }: { songs: AdminSong[] }) {
  return (
    <AdminLayout title="Music admin">
      <MusicAdmin initialSongs={songs} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server, so nobody else ever gets the
// page. Uses the member's current role in the database.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  const songs = await Songs.find()
    .collation({ locale: "en", strength: 2 })
    .sort({ title: 1 })
    .lean();
  return { props: { songs: songs.map(toAdminSong) } };
}

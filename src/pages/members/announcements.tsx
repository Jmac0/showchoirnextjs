import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AnnouncementsAdmin } from "@/src/components/members/AnnouncementsAdmin";
import { listAnnouncements } from "@/src/lib/announcements";
import { AnnouncementRow } from "@/src/lib/announcementsShared";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";

// Announcements admin page - the notice board members see on the dashboard
// and in the app. Opened from the admin ribbon (admins only).
export default function AnnouncementsPage({
  announcements,
}: {
  announcements: AnnouncementRow[];
}) {
  return (
    <AdminLayout title="Announcements">
      <AnnouncementsAdmin initialAnnouncements={announcements} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  return { props: { announcements: await listAnnouncements() } };
}

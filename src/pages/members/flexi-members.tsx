import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { FlexiMembersAdmin } from "@/src/components/members/FlexiMembersAdmin";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import { listFlexiMembers } from "@/src/lib/flexiMembers";
import { FlexiMemberRow } from "@/src/lib/flexiMembersShared";

// Flexi members admin page - bringing existing Flexi members (who used to
// sign in on paper) over from Mailchimp and inviting them to set up their
// accounts. Opened from the admin ribbon (admins only).
export default function FlexiMembersPage({
  members,
}: {
  members: FlexiMemberRow[];
}) {
  return (
    <AdminLayout title="Flexi members">
      <FlexiMembersAdmin initialMembers={members} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  return { props: { members: await listFlexiMembers() } };
}

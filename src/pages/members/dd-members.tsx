import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { DDMembersAdmin } from "@/src/components/members/DDMembersAdmin";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import { listDDMembers } from "@/src/lib/ddMembers";
import { DDMemberRow } from "@/src/lib/ddMembersShared";

// DD members admin page - bringing existing Direct Debit members (who used
// to sign in on paper) over from GoCardless and inviting them to set up
// their accounts. Opened from the admin ribbon (admins only).
export default function DDMembersPage({ members }: { members: DDMemberRow[] }) {
  return (
    <AdminLayout title="Direct Debit members">
      <DDMembersAdmin initialMembers={members} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  return { props: { members: await listDDMembers() } };
}

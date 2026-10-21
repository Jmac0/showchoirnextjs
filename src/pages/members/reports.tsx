import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { ActiveMembersReport } from "@/src/components/admin/reports/ActiveMembersReport";
import { AttendanceReport } from "@/src/components/admin/reports/AttendanceReport";
import { FlexiSessionsReport } from "@/src/components/admin/reports/FlexiSessionsReport";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import { getVenueData } from "@/src/lib/contentfulClient";
import { ReportVenue } from "@/src/lib/reportsShared";
import { choirName } from "@/src/lib/venues";

const TITLES: Record<string, string> = {
  active: "Active members",
  attendance: "Attendance",
  flexi: "Flexi sessions",
};

// Reports admin page - the first page of the admin area (the members menu's
// "Admin" link). Which report shows comes from ?report=, picked in the
// admin ribbon; none means Active members.
export default function ReportsPage({ venues }: { venues: ReportVenue[] }) {
  const { query } = useRouter();
  const report =
    typeof query.report === "string" && TITLES[query.report]
      ? query.report
      : "active";

  return (
    <AdminLayout title={TITLES[report]}>
      {report === "active" && <ActiveMembersReport />}
      {report === "attendance" && <AttendanceReport venues={venues} />}
      {report === "flexi" && <FlexiSessionsReport venues={venues} />}
    </AdminLayout>
  );
}

// Admins only - checked here on the server. The choirs, for the reports'
// choir pickers, come from Contentful.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  const { items } = await getVenueData();
  const venues: ReportVenue[] = [...items]
    .sort((a, b) => a.fields.order - b.fields.order)
    .map(({ fields }) => ({
      slug: fields.slug,
      name: choirName(fields.location),
    }));
  return { props: { venues } };
}

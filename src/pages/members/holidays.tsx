import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { HolidaysAdmin } from "@/src/components/members/HolidaysAdmin";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import { listHolidays } from "@/src/lib/holidays";
import { HolidayRow } from "@/src/lib/holidaysShared";

// Holidays admin page - the breaks with no rehearsals, shown on the Book a
// taster form while they're on. Opened from the admin ribbon (admins only).
export default function HolidaysPage({ holidays }: { holidays: HolidayRow[] }) {
  return (
    <AdminLayout title="Holidays">
      <HolidaysAdmin initialHolidays={holidays} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  return { props: { holidays: await listHolidays() } };
}

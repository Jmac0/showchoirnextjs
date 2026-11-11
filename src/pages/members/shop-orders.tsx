import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { ShopOrdersAdmin } from "@/src/components/members/ShopOrdersAdmin";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import { getChoirVenues } from "@/src/lib/contentfulClient";
import { listOrders } from "@/src/lib/shop";
import { ShopOrderRow } from "@/src/lib/shopShared";
import { choirNames } from "@/src/lib/venues";

// Kit shop orders admin page - who ordered what, for which choir, and how
// it's getting on. Opened from the admin ribbon (admins only).
export default function ShopOrdersPage({
  orders,
  venues,
}: {
  orders: ShopOrderRow[];
  venues: string[];
}) {
  return (
    <AdminLayout title="Shop orders">
      <ShopOrdersAdmin initialOrders={orders} venues={venues} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  return {
    props: {
      orders: await listOrders(),
      venues: choirNames(await getChoirVenues()),
    },
  };
}

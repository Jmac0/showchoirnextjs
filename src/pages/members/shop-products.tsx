import type { GetServerSidePropsContext } from "next";
import React from "react";

import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { ShopProductsAdmin } from "@/src/components/members/ShopProductsAdmin";
import { requireAdminPage } from "@/src/lib/auth/requireAdminPage";
import { listProducts } from "@/src/lib/shop";
import { ShopProductRow } from "@/src/lib/shopShared";

// Kit shop products admin page - what's in the members' Shop. Opened from
// the admin ribbon (admins only).
export default function ShopProductsPage({
  products,
}: {
  products: ShopProductRow[];
}) {
  return (
    <AdminLayout title="Shop products">
      <ShopProductsAdmin initialProducts={products} />
    </AdminLayout>
  );
}

// Admins only - checked here on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirect = await requireAdminPage(context);
  if (redirect) return redirect;

  return {
    props: {
      products: await listProducts({ requestHost: context.req.headers.host }),
    },
  };
}

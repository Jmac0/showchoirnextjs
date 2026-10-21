import Head from "next/head";
import React from "react";

import { AdminRibbon } from "@/src/components/admin/AdminRibbon";
import MemberNav from "@/src/components/Navigation/MemberNav";

type Props = {
  // The browser tab title and the page heading
  title: string;
  children: React.ReactNode;
};

// Every admin page: the members menu, the admin ribbon across the top, and
// the page's contents underneath
export function AdminLayout({ title, children }: Props) {
  return (
    <div className="fixed top-0 m-0 flex w-full p-0">
      <Head>
        <title>{title}</title>
      </Head>
      <MemberNav />
      {/* Scrolls itself - the page around it is fixed, like the dashboard */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Clears the hamburger button on phones */}
        <div className="pt-16 md:pt-0">
          <AdminRibbon />
        </div>
        <section className="flex w-full flex-col items-center px-4 pb-24 pt-10 md:px-10">
          <h1 className="mb-6 text-center">{title}</h1>
          {children}
        </section>
      </div>
    </div>
  );
}

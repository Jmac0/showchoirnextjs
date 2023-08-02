import Head from "next/head";
import React from "react";

import { getPageData } from "@/src/lib/contentfulClient";

import Logo from "../components/Logo";
import { Nav } from "../components/Navigation/Nav";
import { PageItemType } from "../types/types";

function NewAccountRedirectPage({ pathData }: PageItemType) {
  return (
    <div className="flex flex-col">
      <Head>
        <title>Join Show Choir</title>
        <meta
          name="Join Show Choir"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo />
      <Nav pathData={pathData} />
      <div
        className="mt-64 flex w-11/12 flex-col items-center justify-evenly self-center rounded-md border-2
       border-lightGold bg-gradient-to-br
       from-lightBlack/75 to-black/75 p-5 text-center text-gray-50 md:w-2/3 lg:w-1/3"
      >
        <h2>&quot; Consider yourself part of the Family! &quot; </h2>
        <p>Check your email for a link to create an account</p>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  /* get paths for each page from Contentful */
  const res = await getPageData();
  const { items } = res;
  const pathData = items.map(
    (item: {
      fields: { slug: string; displayText: string; order: number };
    }) => ({
      slug: item.fields.slug,
      displayText: item.fields.displayText,
      order: item.fields.order,
    })
  );

  return { props: { pathData } };
}
export default NewAccountRedirectPage;

import Head from "next/head";
import Logo from "src/components/Logo";

import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";

type Props = {
  pathData: [{ slug: string; displayText: string; order: number }];
};
export default function MonthlyMembership({ pathData }: Props) {
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

      <main className="mt-16 flex w-screen flex-col items-center bg-transparent p-3 ">
        <header>
          <h1>Monthly Membership Form </h1>
        </header>
      </main>
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

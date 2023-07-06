import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import Head from "next/head";
import { useEffect, useState } from "react";

import { Nav } from "@/src/components/Navigation/Nav";
import { getHomePageData, getPageData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

type Props = {
  title: string;
  content: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  pathData: [{ slug: string; displayText: string; order: number }];
};
export default function Home({ content, title, pathData }: Props) {
  const [bodyTxt, setBodyTxt] = useState("");

  // convert Contentful object to html rich text
  useEffect(() => {
    const bodyHtml = documentToReactComponents(content, formatOptions);
    // set body text in here to solve hydration issue
    setBodyTxt(bodyHtml as string);
  }, [content]);

  return (
    <div className="flex flex-col">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav pathData={pathData} />
      <main className="mt-16 flex w-screen flex-col items-center bg-transparent p-2.5 ">
        <div className="flex w-6/12 flex-col pb-10 text-center">{bodyTxt}</div>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const homepageData = await getHomePageData();
  const {
    fields: { title, content },
  } = homepageData;

  /* get paths for each page from contentful */
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

  return { props: { title, content, pathData } };
}

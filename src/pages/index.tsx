import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import Head from "next/head";
import { useEffect, useState } from "react";

import { getHomePageData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

type Props = {
  title: string;
  content: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
};
export default function Home({ content, title }: Props) {
  const [bodyTxt, setBodyTxt] = useState("");

  // convert Contentful object to html rich text
  useEffect(() => {
    const bodyHtml = documentToReactComponents(content, formatOptions);
    // set body text in here to solve hydration issue
    setBodyTxt(bodyHtml as string);
  }, [content]);

  return (
    <div className="flex flex-col w-full">
      <Head>
        <title>{title}</title>
        <link rel="icon" href="#" />
      </Head>

      <main>{bodyTxt}</main>

      <footer>Footer</footer>
    </div>
  );
}

export async function getStaticProps() {
  const homepageData = await getHomePageData();
  const {
    fields: { title, content },
  } = homepageData;
  return { props: { title, content } };
}

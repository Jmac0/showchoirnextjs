import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import { getPageData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

type Props = {
  pathData?: { slug: string; displayText: string; order: number }[];
  // eslint-disable-next-line react/require-default-props
  currentPage?: {
    title?: string;
    content: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
    flexiInfo: string;
    monthlyInfo: string;
  };
};
export default function Slug({ currentPage, pathData }: Props) {
  // Add back in to destructured currentPage flexiInfo, monthlyInfo
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { title, content } = currentPage!;

  const [bodyTxt, setBodyTxt] = useState("");
  useEffect(() => {
    const bodyHtml = documentToReactComponents(content, formatOptions);
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
        {/*
         <link rel="icon" href="/favicon.ico" />
         */}
      </Head>
      <main className="mt-16 flex w-screen flex-col items-center bg-transparent p-2.5 ">
        <div className="flex w-9/12 flex-col pb-10 text-center">{bodyTxt}</div>
      </main>
    </div>
  );
}

Slug.defaultProps = { pathData: {}, currentPage: {} };

export async function getStaticPaths() {
  const response = await getPageData();
  const { items } = response;
  const paths = items.map((item: { fields: { slug: string } }) => ({
    params: { slug: item.fields.slug },
  }));
  return {
    paths,
    fallback: true,
  };
}

type PathData = {
  fields: { slug: string; displayText: string; order: number };
};

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{
  slug: string;
}>) {
  const res = await getPageData();
  const { items } = res;
  const pathData = items.map((item: PathData) => ({
    slug: item.fields.slug,
    displayText: item.fields.displayText,
    order: item.fields.order,
  }));
  const match = items.find(
    (item: { fields: { slug: string } }) => item.fields.slug === params?.slug
  );
  const currentPage = match?.fields;
  return {
    props: { currentPage, pathData },
  };
}

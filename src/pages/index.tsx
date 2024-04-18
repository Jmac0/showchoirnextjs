import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import Head from "next/head";
import { useEffect, useState } from "react";

import heroImage from "@/public/brollies.png";
import { Hero } from "@/src/components/Hero";
import { Nav } from "@/src/components/Navigation/Nav";
import { getHomePageData, getPageData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

import FeatureBar from "../components/FeatureBar";
import { FeatureDataType } from "../types/types";

type Props = {
  title: string;
  content: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  featureData: FeatureDataType;
  pathData: [{ slug: string; displayText: string; order: number }];
};
export default function Home({ content, featureData, title, pathData }: Props) {
  const [bodyTxt, setBodyTxt] = useState("");

  // convert Contentful object to html rich text
  useEffect(() => {
    const bodyHtml = documentToReactComponents(
      content,

      formatOptions
    );
    // set body text in here to solve hydration issue
    setBodyTxt(bodyHtml as string);
  }, [content]);

  return (
    <div className="flex flex-col bg-black">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Show Choir Surrey's premier musical theatre choir"
        />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="flex flex-col">
        <Hero bgImage={heroImage} heroText={bodyTxt} />
        <Nav pathData={pathData} />
      </section>
      <FeatureBar featureData={featureData} />
    </div>
  );
}

export async function getStaticProps() {
  const homepageData = await getHomePageData();
  const {
    fields: {
      title,
      content,
      contentOne,
      contentTwo,
      contentThree,
      contentOneImage,
      contentTwoImage,
      contentThreeImage,
    },
  } = homepageData;
  // Add feature data strings into an array for easy mapping
  const featureData = [
    {
      text: contentOne,
      image: `https:${contentOneImage.fields.file.url}`,
      imageDescription: contentOneImage.fields.description,
    },
    {
      text: contentTwo,
      image: `https:${contentTwoImage.fields.file.url}`,
      imageDescription: contentTwoImage.fields.description,
    },
    {
      text: contentThree,
      image: `https:${contentThreeImage.fields.file.url}`,
      imageDescription: contentThreeImage.fields.description,
    },
  ];

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

  return {
    props: { title, content, pathData, featureData },
  };
}

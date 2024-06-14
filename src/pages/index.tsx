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
import Footer from "../components/Footer";
import MemberBenefits from "../components/MemberBenefits";
import { extractListItemsFromContentful } from "../lib/helpers/extractListItemsFromContent";
import { FeatureDataType } from "../types/types";

type Props = {
  title: string;
  heroTextOne: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  heroTextTwo: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  memberBenefits: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  featureData: FeatureDataType;
  pathData: [{ slug: string; displayText: string; order: number }];
  heroList: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
};
export default function Home({
  heroTextOne,
  heroTextTwo,
  featureData,
  title,
  pathData,
  memberBenefits,
  heroList,
}: Props) {
  const [heroTxtGreeting, setHeroTxtGreeting] = useState("");
  const [heroTxtSignature, setHeroTxtSignature] = useState("");
  const [memberBenefitsTxt, setMemberBenefits] = useState<[]>([]);
  const [heroListTxt, setHeroListTxt] = useState<[]>([]);

  // convert Contentful object to html rich text
  useEffect(() => {
    const heroText1 = documentToReactComponents(heroTextOne, formatOptions);
    const heroText2 = documentToReactComponents(heroTextTwo, formatOptions);
    const memberBenefitsList = documentToReactComponents(
      memberBenefits,
      formatOptions
    );
    const heroListItems = documentToReactComponents(heroList, formatOptions);

    // set body text in here to solve hydration issue
    setHeroTxtGreeting(heroText1 as string);
    setHeroTxtSignature(heroText2 as string);
    setMemberBenefits(memberBenefitsList as []);
    setHeroListTxt(heroListItems as []);
  }, [memberBenefits, heroList, heroTextOne, heroTextTwo]);

  const heroListArray = extractListItemsFromContentful(heroListTxt);

  return (
    <div className="flex h-screen flex-col bg-black">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Show Choir Surrey's premier musical theatre choir"
        />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="flex flex-col">
        <Hero
          bgImage={heroImage}
          heroTextGreeting={heroTxtGreeting}
          heroTextSignature={heroTxtSignature}
          heroListItems={heroListArray}
        />
        <Nav pathData={pathData} />
      </section>
      <FeatureBar featureData={featureData} />
      <MemberBenefits content={memberBenefitsTxt} />
      <Footer pathData={pathData} />
    </div>
  );
}

export async function getStaticProps() {
  const homepageData = await getHomePageData();
  const {
    fields: {
      title,
      contentOne,
      contentTwo,
      contentThree,
      contentOneImage,
      contentTwoImage,
      contentThreeImage,
      memberBenefits,
      heroList,
      heroTextOne,
      heroTextTwo,
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
    props: {
      title,
      pathData,
      featureData,
      memberBenefits,
      heroList,
      heroTextOne,
      heroTextTwo,
    },
  };
}

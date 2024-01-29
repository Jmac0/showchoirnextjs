import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData, getVenueData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

import { AboutComponentContainer } from "../components/AboutComponentContainer";
import Logo from "../components/Logo";
import { MembershipOptionsContainer } from "../components/MembershipOptionsContainer";
import VenueCardContainer from "../components/VenueCardContainer";
import { ContentBlocksType, PathDataType, VenueType } from "../types/types";

type Props = {
  pathData: {
    slug: string;
    displayText: string;
    order: number;
  }[];
  // eslint-disable-next-line react/require-default-props
  currentPage?: {
    title?: string;
    content: ContentBlocksType;
    contentOne: string;
    contentTwo: string;
  };
  venues: VenueType[];
};
export default function Slug({ currentPage, pathData, venues }: Props) {
  // Add back in to destructured currentPage flexiInfo, monthlyInfo
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!currentPage) throw new Error("No page data found at build time!");
  const { title, content, contentTwo, contentOne } = currentPage;
  const [bodyTxt, setBodyTxt] = useState("");
  useEffect(() => {
    const bodyHtml = documentToReactComponents(content, formatOptions);
    setBodyTxt(bodyHtml as string);
  }, [content]);

  return (
    <div className="m-0 flex w-full flex-col">
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
      <Logo />
      <Nav pathData={pathData} />
      <main className="mt-16 flex w-full flex-col items-center bg-transparent md:mt-2 ">
        <section className="mt-14 flex w-full flex-col md:mt-28 md:pb-10">
          {/* <h1 className="self-center">{title}</h1> */}
          <div className="flex w-full flex-col px-2 md:flex-row md:space-x-11 md:pl-16">
            {/* {bodyTxt} */}
          </div>
        </section>
        {/* Component to display about page information */}
        {title === "About Show Choir" && (
          <AboutComponentContainer
            title={title}
            bodyTxt={bodyTxt}
            whatToExpectTxt={contentOne}
            feelGoodFactorTxt={contentTwo}
          />
        )}
        {/* component displaying membership option boxes */}
        {title === "Join" && (
          <MembershipOptionsContainer
            bodyTxt={bodyTxt}
            flexiInfo={contentOne}
            monthlyInfo={contentTwo}
          />
        )}
        {/* Component to display cards containing choir venue information */}
        {title === "Choirs" && (
          <VenueCardContainer bodyTxt={bodyTxt} venueData={venues} />
        )}
      </main>
    </div>
  );
}

Slug.defaultProps = {
  currentPage: {},
};

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

export async function getStaticProps({ params }: GetStaticPropsContext) {
  // gets all static page data from Contentful
  const res = await getPageData();
  // Get venue data separately, to keep Contentful easy to manage
  const venueResponse = await getVenueData();
  const venues = venueResponse.items.map((venue) => ({
    location: venue.fields.location,
    address: venue.fields.address,
    choirDayOfWeek: venue.fields.choirDayOfWeek,
    mapid: venue.fields.mapid,
    order: venue.fields.order,
    time: venue.fields.time,
    slug: venue.fields.slug,
  }));
  const { items } = res;
  const pathData = items.map((item: PathDataType) => ({
    slug: item.fields.slug,
    displayText: item.fields.displayText,
    order: item.fields.order,
  }));
  const match = items.find(
    (item: { fields: { slug: string } }) => item.fields.slug === params?.slug
  );
  // the current page to build from the api data & slug
  const currentPage = match?.fields;
  return {
    props: { currentPage, pathData, venues },
  };
}

import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData, getVenueData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

import Logo from "../components/Logo";
import { MembershipOptionsContainer } from "../components/MembershipOptionsContainer";
import VenueCardContainer from "../components/VenueCardContainer";
import { ContentBlocksType, VenueType } from "../types/types";

type Props = {
  pathData?: { slug: string; displayText: string; order: number }[];
  // eslint-disable-next-line react/require-default-props
  currentPage?: {
    title?: string;
    content: ContentBlocksType;
    flexiInfo: string;
    monthlyInfo: string;
  };
  venues: VenueType[];
};
export default function Slug({ currentPage, pathData, venues }: Props) {
  // Add back in to destructured currentPage flexiInfo, monthlyInfo
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { title, content, monthlyInfo, flexiInfo } = currentPage!;

  const [bodyTxt, setBodyTxt] = useState("");
  useEffect(() => {
    const bodyHtml = documentToReactComponents(content, formatOptions);
    setBodyTxt(bodyHtml as string);
  }, [content]);

  return (
    <div className="m-0 flex flex-col p-0">
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
      <main className="mt-16 flex w-screen flex-col items-center bg-transparent p-3 md:mt-2 ">
        <div className="flex w-9/12 flex-col pb-10 text-center md:mt-20">
          {bodyTxt}
        </div>
        {/* component displaying membership option boxes */}
        {flexiInfo && (
          <MembershipOptionsContainer
            flexiInfo={flexiInfo}
            monthlyInfo={monthlyInfo}
          />
        )}
        {title === "Choirs" && <VenueCardContainer venueData={venues} />}
      </main>
    </div>
  );
}

Slug.defaultProps = {
  pathData: [],
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

type PathData = {
  fields: { slug: string; displayText: string; order: number };
};

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{
  slug: string;
}>) {
  // gets all static page data from Contentful
  const res = await getPageData();
  // Get venue data separately, to keep Contentful easy to manage
  const venueResponse = await getVenueData();
  const venues = venueResponse.items.map((venue) => ({
    location: venue.fields.venueName,
    address: venue.fields.address,
    mapid: venue.fields.mapid,
    order: venue.fields.order,
  }));
  const { items } = res;
  const pathData = items.map((item: PathData) => ({
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

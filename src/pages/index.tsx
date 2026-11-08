import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import Head from "next/head";

import heroImage from "@/public/oklahoma.jpg";
import { Hero } from "@/src/components/Hero";
import { jsonLdScript } from "@/src/components/JsonLd";
import { Nav } from "@/src/components/Navigation/Nav";
import { PhoneBookBar } from "@/src/components/StageElements";
import {
  CONTENTFUL_REVALIDATE_SECONDS,
  getHomePageData,
  getPageData,
  getVenueData,
} from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";
import { organizationJsonLd } from "@/src/lib/structuredData";

import FeatureBar from "../components/FeatureBar";
import Footer from "../components/Footer";
import MemberBenefits from "../components/MemberBenefits";
import { extractListItemsFromContentful } from "../lib/helpers/extractListItemsFromContent";
import { FeatureDataType, VenueType } from "../types/types";

type Props = {
  title: string;
  heroTextOne: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  memberBenefits: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  featureData: FeatureDataType;
  pathData: [{ slug: string; displayText: string; order: number }];
  heroList: { data: object; content: []; nodeType: BLOCKS.DOCUMENT };
  venues: VenueType[];
};
export default function Home({
  heroTextOne,
  featureData,
  title,
  pathData,
  memberBenefits,
  heroList,
  venues,
}: Props) {
  // Contentful's rich text turned into page text while the page is built, so
  // it's in the HTML that search engines and AI tools read (most of them don't
  // run JavaScript, so text added later in the browser is invisible to them)
  const heroTxtGreeting = documentToReactComponents(heroTextOne, formatOptions);
  const memberBenefitsTxt = documentToReactComponents(
    memberBenefits,
    formatOptions
  ) as [];
  const heroListArray = extractListItemsFromContentful(
    documentToReactComponents(heroList, formatOptions) as []
  );

  return (
    <div className="flex flex-col overflow-x-hidden bg-black">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Show Choir Surrey is a friendly, no audition musical theatre choir with rehearsals in Banstead, Leatherhead, Dorking, Cobham, West Byfleet and Walton-on-Thames. Book a free taster session today."
        />
        <link rel="canonical" href="https://show-choir.co.uk/" />
        <link rel="icon" href="/favicon.ico" />
        {/* structured data - tells search engines and AI tools this is one
         choir with groups in several Surrey towns, each with its own page */}
        {jsonLdScript(organizationJsonLd(venues))}
      </Head>
      <section className="flex flex-col">
        <Hero
          bgImage={heroImage}
          heroTextGreeting={heroTxtGreeting}
          heroListItems={heroListArray}
          venues={venues}
        />
        <Nav pathData={pathData} />
      </section>
      <FeatureBar featureData={featureData} />
      <MemberBenefits content={memberBenefitsTxt} venues={venues} />
      <Footer pathData={pathData} />
      <PhoneBookBar />
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

  // Get venue data separately, to keep Contentful easy to manage
  const venueResponse = await getVenueData();
  const venues = venueResponse.items.map((venue) => ({
    location: venue.fields.location,
    address: venue.fields.address,
    choirDayOfWeek: venue.fields.choirDayOfWeek,
    googleMap: venue.fields.googleMap,
    order: venue.fields.order,
    time: venue.fields.time,
    slug: venue.fields.slug,
  }));

  return {
    props: {
      title,
      pathData,
      featureData,
      memberBenefits,
      heroList,
      heroTextOne,
      venues,
    },
    revalidate: CONTENTFUL_REVALIDATE_SECONDS,
  };
}

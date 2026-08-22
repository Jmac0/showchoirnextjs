import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData, getVenueData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";

import { AboutComponentContainer } from "../components/AboutComponentContainer";
import Footer from "../components/Footer";
import ContactForm from "../components/forms/ContactForm";
import Logo from "../components/Logo";
import { MembershipOptionsContainer } from "../components/MembershipOptionsContainer";
import VenueCardContainer from "../components/VenueCardContainer";
import fringeStepsImage from "../../public/fringe-steps.jpg";

import {
  ContentBlocksType,
  ContentfulImageType,
  PathDataType,
  VenueType,
} from "../types/types";
import BookTasterFrom from "../components/forms/BookTasterForm";
import BookTasterPopUpForm from "../components/forms/BookTasterPopUpForm";
import { HeroVideo } from "../components/HeroVideo";

// per-page meta descriptions, keyed by the CMS "title" field, so each
// page targets its own keywords instead of sharing one generic line
const pageDescriptions: Record<string, string> = {
  "About Show Choir Surrey":
    "Learn about Show Choir Surrey, a friendly no audition musical theatre choir welcoming singers of all abilities across Surrey.",
  "Join Us - No Auditions Needed!":
    "Join Show Choir Surrey today - a no audition musical theatre choir with rehearsals in Banstead, Leatherhead, Dorking, Cobham and West Byfleet. Book your free taster session.",
  "Our Choirs - Across Surrey":
    "Find your local Show Choir Surrey rehearsal in Banstead, Leatherhead, Dorking, Cobham or West Byfleet.",
  Contact:
    "Get in touch with Show Choir Surrey to find out more about our no audition musical theatre choir.",
};
const defaultDescription = "Show Choir Surrey's premier musical theatre choir";

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
    mainImage: ContentfulImageType;
    heroTextOne: ContentBlocksType;
    contentOne: string;
    contentTwo: string;
  };
  venues: VenueType[];
  slug: string;
};

export default function Slug({ currentPage, pathData, venues, slug }: Props) {
  // Add back in to destructured currentPage flexiInfo, monthlyInfo
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!currentPage) throw new Error("No page data found at build time!");
  const { title, content, contentOne, contentTwo, heroTextOne, mainImage } =
    currentPage;
  const description = (title && pageDescriptions[title]) || defaultDescription;

  const [bodyTxt, setBodyTxt] = useState("");
  const [heroTxtOne, setHeroTxtOne] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  useEffect(() => {
    const bodyHtml = documentToReactComponents(content, formatOptions);
    setBodyTxt(bodyHtml as string);
    const heroText = documentToReactComponents(heroTextOne, formatOptions);
    setHeroTxtOne(heroText as string);
  }, [content, heroTextOne]);
  return (
    <div className="m-0 flex h-screen w-full flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://show-choir.co.uk/${slug}`} />
        {/*
         <link rel="icon" href="/favicon.ico" />
         */}
      </Head>
      <Logo color="gold" />
      <Nav pathData={pathData} />
      <main className="mb-0 mt-16 flex w-full flex-col items-center bg-transparent md:mt-2 ">
        <section className="mt-14 flex w-full flex-col md:mt-28 md:pb-10">
          {/* <h1 className="self-center">{title}</h1> */}
          <div className="flex w-full flex-col px-2 md:flex-row md:space-x-11 md:pl-16">
            {/* {bodyTxt} */}
          </div>
        </section>
        {/* Component to display about page information */}
        {title === "About Show Choir Surrey" && (
          <AboutComponentContainer
            title={title}
            mainImage={mainImage}
            heroTextOne={heroTxtOne}
            whatToExpectTxt={contentOne}
            feelGoodFactorTxt={contentTwo}
          />
        )}
        {/* component displaying membership option boxes */}
        {title === "Join Us - No Auditions Needed!" && (
          <>
            <h1 className="mb-7 py-6 text-3xl md:text-5xl">{title}</h1>

            <section className="relative h-[500px] w-full  md:w-full ">
              <h1 className="absolute bottom-40 left-0 z-20  w-full text-center text-white lg:text-4xl ">
                Your Musical Journey Starts Here!
              </h1>
              <span className="pointer-events-none absolute z-10 h-full w-full bg-gradient-to-t from-black/100 to-transparent " />
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="absolute bottom-20 left-1/2 z-10 flex h-9 w-auto max-w-md  -translate-x-1/2 content-center items-center justify-center rounded-md border-2 border-lightGold bg-lightGold
       p-6  text-black transition-shadow hover:shadow-[0_0_12px_2px_rgba(222,204,120,0.8)]"
              >
                Book Your Free Taster
              </button>

              <Image
                className="rounded-3xl object-cover"
                fill
                priority
                alt="image of choir signing"
                src={fringeStepsImage}
              />
            </section>
            {isBookingOpen && (
              <div
                role="presentation"
                onClick={() => setIsBookingOpen(false)}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
              >
                <div
                  role="presentation"
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    aria-label="Close booking form"
                    className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-lightGold bg-black text-white hover:bg-lightGold hover:text-black"
                  >
                    &times;
                  </button>
                  <BookTasterFrom className="lg:!w-full" />
                </div>
              </div>
            )}
            <MembershipOptionsContainer
              flexiInfo={contentOne}
              monthlyInfo={contentTwo}
            />
          </>
        )}

        {title === "Get the feel good factor!" && (
          <>
            <HeroVideo videoUrl="/Hero-Vid-rough.mov">
              <h1 className="heading-impact relative z-10 flex flex-col items-center text-gold">
                <span className="tracking-wide">GET THE MUSICAL </span>
                <span className="tracking-tight">FEEL-GOOD FACTOR!</span>
              </h1>
            </HeroVideo>
            <p>{contentOne}</p>
          </>
        )}

        {/* Component to display cards containing choir venue information */}
        {title === "Our Choirs - Across Surrey" && (
          <>
            <section className="flex flex-col items-center">
              <h1 className="mb-6">{title}</h1>
              <p className="mb-4 w-11/12 rounded-2xl bg-white p-3 text-gray-900 md:w-7/12">
                You are welcome to come along for a FREE taster at any of our
                choirs in Surrey, Banstead, Leatherhead, Dorking, Cobham & West
                Byfleet. All you need is a bottle of water, a love of singing,
                and a sense of humour!
              </p>
              <BookTasterPopUpForm
                isBookingOpen={isBookingOpen}
                setIsBookingOpen={setIsBookingOpen}
              />
            </section>
            <VenueCardContainer bodyTxt={bodyTxt} venueData={venues} />
          </>
        )}
        {title === "Contact" && (
          <div className="mb-12 mt-8 flex h-full w-11/12 md:w-2/3 2xl:w-1/3 ">
            <ContactForm />
          </div>
        )}
      </main>
      <Footer pathData={pathData} />
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
    googleMap: venue.fields.googleMap,
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
    (item: { fields: { slug: string } }) => item.fields.slug === params?.slug,
  );
  // the current page to build from the api data & slug
  const currentPage = match?.fields;
  return {
    props: { currentPage, pathData, venues, slug: params?.slug as string },
  };
}

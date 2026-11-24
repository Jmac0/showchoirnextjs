import Image from "next/image";
import { useEffect, useState } from "react";

import logo from "@/public/logo.png";
import oklahomaImage from "@/public/oklahoma.jpg";
import {
  BeyondRehearsals,
  ChoirQuestions,
  FirstNight,
  FromAngela,
  JoinOptions,
  NoBarriers,
} from "@/src/components/ChoirSections";
import Footer from "@/src/components/Footer";
import BookTasterFrom from "@/src/components/forms/BookTasterForm";
import { Nav } from "@/src/components/Navigation/Nav";
import { PageMeta } from "@/src/components/PageMeta";
import {
  BookButton,
  PhoneBookBar,
  ScrollingBanner,
  StageBackdrop,
} from "@/src/components/StageElements";
import { GENERAL_QUESTIONS } from "@/src/lib/choirQuestions";
import {
  CONTENTFUL_REVALIDATE_SECONDS,
  getHomePageData,
  getPageData,
  getVenueData,
} from "@/src/lib/contentfulClient";
import { membershipPrices } from "@/src/lib/membershipPrices";
import { withoutUndefined } from "@/src/lib/staticProps";
import { choirName } from "@/src/lib/venues";
import styles from "@/src/styles/stage.module.css";
import { PathDataType, VenueType } from "@/src/types/types";

// Landing page for the Facebook ad about the new Walton-on-Thames choir, at
// /walton. It's a file of its own rather than a Contentful page, which is what
// keeps it out of the main menu and the sitemap (both are built from Contentful).
// It has the site's usual menu at the top (and the footer links), so people
// who arrive from the ad can look round the rest of the site too.
//
// After the campaign, just delete this file: its styling (styles/stage.module.css,
// components/StageElements.tsx), sections (components/ChoirSections.tsx, also
// on every choir's page) and video (public/hero.mp4) are shared.

// As spelt in Contentful's venue, without "Show Choir" (lib/venues.ts choirName)
const WALTON = "Walton on Thames";
// 8pm on launch night (January, so UK time is the same as UTC)
const LAUNCH = new Date("2027-01-19T20:00:00Z");
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type Props = {
  // One choir only: the form's dropdown lists what it's given, and everyone
  // here came for Walton. An array so the form can be handed it unchanged
  venues: VenueType[];
  pathData: { slug: string; displayText: string; order: number }[];
  disneyImageUrl: string;
  kerryImageUrl: string;
  // in pounds, from the settings: monthly Direct Debit and a Flexi pack
  monthlyPrice: number;
  flexiPrice: number | null;
};

export default function Walton({
  venues,
  pathData,
  disneyImageUrl,
  kerryImageUrl,
  monthlyPrice,
  flexiPrice,
}: Props) {
  const venue = venues[0];
  // Worked out in the browser only: the page is built once in advance, so a
  // count made then would be out of date and wouldn't match when React loads
  const [daysToGo, setDaysToGo] = useState<number | null>(null);

  useEffect(() => {
    setDaysToGo(Math.ceil((LAUNCH.getTime() - Date.now()) / DAY_IN_MS));
  }, []);

  const title = "Show Choir is coming to Walton-on-Thames | 19th January";
  const description =
    "A brand new musical theatre choir for Walton-on-Thames, launching Tuesday 19th January. No auditions, no need to read music. Tuesdays 8:00-9:30pm. Book your free taster!";

  return (
    <div className="flex flex-col overflow-x-hidden bg-black">
      <PageMeta title={title} description={description} path="/walton" />

      {/* The site's menu, over the top of the hero (same as the home page) */}
      <Nav pathData={pathData} />

      {/* ---------- Hero ---------- */}
      <section
        id="hero"
        className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center"
      >
        <StageBackdrop image={oklahomaImage} alt="" />

        <Image
          src={logo}
          alt="Show Choir"
          priority
          className="absolute right-3 top-3 z-10 h-auto w-24 md:right-8 md:top-5 md:w-36"
        />

        <div className="relative z-10 flex max-w-6xl flex-col items-center">
          <p className="m-0 rounded-full border border-lightGold bg-black/50 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-lightGold md:px-4 md:text-base md:tracking-[0.2em]">
            New choir. No auditions. All welcome.
          </p>
          <h1
            className={`${styles.display} ${styles.heroTitle} ${styles.goldText} mt-5`}
          >
            Walton,
            <br />
            it&apos;s your cue!
          </h1>
          <p className="mb-6 mt-5 max-w-2xl text-xl font-bold leading-snug text-white md:text-3xl">
            Show Choir, the no-audition musical theatre choir, is coming to
            Walton-on-Thames.
          </p>

          {/* the launch details, printed as a theatre ticket */}
          <div
            className={`${styles.ticket} mb-7 w-full max-w-xl px-7 py-3 text-black`}
          >
            <div className="flex items-center justify-center gap-3 border-y-2 border-dashed border-black/40 py-3">
              <div className="text-left">
                <p className="m-0 text-xs font-bold uppercase leading-tight tracking-widest text-black/70">
                  Opening night
                </p>
                <p
                  className={`${styles.display} m-0 text-2xl text-black md:text-4xl`}
                >
                  Tuesday 19th January
                </p>
                <p className="m-0 text-sm font-bold leading-snug text-black md:text-base">
                  8:00 - 9:30pm, St Andrews, Hersham Road
                </p>
              </div>
            </div>
          </div>

          <BookButton />
          {daysToGo !== null && daysToGo > 0 && (
            <p className="mb-0 mt-5 font-bold text-white">
              <span className="text-lightGold">
                {daysToGo} {daysToGo === 1 ? "day" : "days"}
              </span>{" "}
              until curtain up
            </p>
          )}
        </div>
      </section>

      <ScrollingBanner />

      <main className="w-full">
        <NoBarriers />

        {/* ---------- When and where ---------- */}
        <section className="bg-lightBlack px-4 py-16 md:px-10">
          <div className="mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2
                className={`${styles.display} ${styles.sectionTitle} mb-6 text-white`}
              >
                Every Tuesday.
                <br />
                <span className={styles.goldText}>8:00 - 9:30pm.</span>
              </h2>
              <p className="m-0 text-xl font-bold text-white">
                St Andrews URC Walton and Weybridge
              </p>
              <p className="m-0 text-lg text-gray-200">
                7-19 Hersham Road, Walton-on-Thames, Surrey, KT12 1LQ
              </p>
              <p className="mt-4 text-lg text-gray-200">
                Plenty of parking is available at the church. We start on
                Tuesday 19th January, so you&apos;ll be there from the very
                first note, along with everybody else!
              </p>
            </div>
            <div className="grid gap-4">
              {venue?.photo && (
                <Image
                  src={`https:${venue.photo.fields.file.url}`}
                  alt="St Andrews in Walton-on-Thames, where the choir meets"
                  width={800}
                  height={743}
                  sizes="(max-width: 768px) 92vw, 45vw"
                  className="h-56 w-full rounded-2xl border-2 border-lightGold object-cover md:h-64"
                />
              )}
              {venue?.googleMap && (
                <iframe
                  title="Map showing St Andrews in Walton-on-Thames"
                  src={`https://www.google.com/maps/d/u/0/embed?mid=${venue.googleMap}`}
                  loading="lazy"
                  className="h-56 w-full rounded-2xl border-2 border-lightGold md:h-64"
                />
              )}
            </div>
          </div>
        </section>

        <FirstNight />

        <BeyondRehearsals
          disneyImageUrl={disneyImageUrl}
          kerryImageUrl={kerryImageUrl}
        />

        <FromAngela closing="Now she's bringing it to Walton-on-Thames, and she'd love to see you there." />

        <JoinOptions
          monthlyPrice={monthlyPrice}
          flexiPrice={flexiPrice ?? undefined}
        />

        <ChoirQuestions questions={GENERAL_QUESTIONS} />

        {/* ---------- Booking form ---------- */}
        <section
          id="book"
          className={`${styles.spotlight} relative scroll-mt-4 overflow-hidden px-4 pb-16 pt-20 md:px-10`}
        >
          <span
            className={`${styles.star} left-[8%] top-[10%] h-8 w-8 md:h-12 md:w-12`}
          />
          <span
            className={`${styles.star} right-[8%] top-[22%] h-6 w-6 [animation-delay:-1.3s] md:h-10 md:w-10`}
          />
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-3 text-center`}
            >
              <span className={styles.goldText}>Curtain up, Walton!</span>
            </h2>
            <p className="mb-8 text-center text-xl text-white">
              Your place in the choir is waiting. It&apos;s free, and it could
              be the best thing you do all year.
            </p>
            <BookTasterFrom venues={venues} defaultChoir={WALTON} />
          </div>
        </section>
      </main>

      <Footer pathData={pathData} />

      <PhoneBookBar />
    </div>
  );
}

export async function getStaticProps() {
  const [venueResponse, pageResponse, homeResponse] = await Promise.all([
    getVenueData(),
    getPageData(),
    // the Disneyland and Kerry Ellis pictures are the home page's own
    getHomePageData(),
  ]);

  const venues = venueResponse.items
    .filter((venue) => choirName(venue.fields.location) === WALTON)
    .map((venue) => ({
      location: venue.fields.location,
      address: venue.fields.address,
      choirDayOfWeek: venue.fields.choirDayOfWeek,
      time: venue.fields.time,
      order: venue.fields.order,
      slug: venue.fields.slug,
      googleMap: venue.fields.googleMap,
      parking: venue.fields.parking,
      photo: venue.fields.photo,
    }));

  const pathData = pageResponse.items.map((item: PathDataType) => ({
    slug: item.fields.slug,
    displayText: item.fields.displayText,
    order: item.fields.order,
  }));

  const home = homeResponse as {
    fields: {
      contentOneImage?: { fields: { file: { url: string } } };
      contentTwoImage?: { fields: { file: { url: string } } };
    };
  };

  return {
    props: withoutUndefined({
      venues,
      pathData,
      disneyImageUrl: home.fields.contentOneImage?.fields.file.url ?? "",
      kerryImageUrl: home.fields.contentTwoImage?.fields.file.url ?? "",
      ...membershipPrices(),
    }),
    revalidate: CONTENTFUL_REVALIDATE_SECONDS,
  };
}

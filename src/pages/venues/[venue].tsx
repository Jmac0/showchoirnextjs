import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { faSquareParking } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Image from "next/image";

import logo from "@/public/logo.png";
import oklahomaImage from "@/public/oklahoma.jpg";
import Footer from "@/src/components/Footer";
import BookTasterFrom from "@/src/components/forms/BookTasterForm";
import { jsonLdScript } from "@/src/components/JsonLd";
import { Nav } from "@/src/components/Navigation/Nav";
import {
  BookButton,
  PhoneBookBar,
  ScrollingBanner,
  StageBackdrop,
} from "@/src/components/StageElements";
import { useChoirStart } from "@/src/hooks/useChoirStart";
import {
  CONTENTFUL_REVALIDATE_SECONDS,
  getPageData,
  getVenueData,
} from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";
import { monthlyAmountPence } from "@/src/lib/gocardless";
import { venueJsonLd } from "@/src/lib/structuredData";
import { choirName } from "@/src/lib/venues";
import styles from "@/src/styles/stage.module.css";
import { PathDataType, VenueType } from "@/src/types/types";

type Props = {
  currentPage?: VenueType;
  // every choir, for the booking form's dropdown
  venues?: VenueType[];
  pathData?: { slug: string; displayText: string; order: number }[];
  // the monthly Direct Debit price in pence, for the structured data
  monthlyPricePence?: number;
};
// displays a pre rendered page with details for a single venue
export default function Venue({
  pathData,
  currentPage,
  venues,
  monthlyPricePence,
}: Props) {
  if (!currentPage) throw new Error("No page data available at build time");
  const {
    location,
    address,
    time,
    parking,
    googleMap,
    description,
    photo,
    choirDayOfWeek,
    slug,
  } = currentPage;
  // the address from Contentful, turned into page text while the page is
  // built so search engines and AI tools (most don't run JavaScript) see it
  const venueAddress = documentToReactComponents(address, formatOptions);
  const startText = useChoirStart(location);
  // Contentful's location is "Show Choir <town>", which leads the title for
  // search; the description just needs the town
  const town = choirName(location);
  const pageTitle = `${location} | No Audition Musical Theatre Choir in Surrey`;
  const pageDescription = `Join our friendly, no audition musical theatre choir in ${town}, Surrey.${
    choirDayOfWeek ? ` Rehearsals every ${choirDayOfWeek}` : ""
  }${time ? ` at ${time}` : ""}. Book a free taster session today.`;
  // getStaticProps gives an empty object to a choir with no photo
  const photoUrl = photo?.fields?.file?.url;
  return (
    <div className="flex flex-col overflow-x-hidden bg-black">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link
          rel="canonical"
          href={`https://show-choir.co.uk/venues/${slug}`}
        />
        {/* where, when and how much, for search engines and AI tools */}
        {jsonLdScript(
          venueJsonLd({
            location,
            slug,
            address,
            choirDayOfWeek,
            time,
            summary: pageDescription,
            monthlyPricePence: monthlyPricePence as number,
          })
        )}
      </Head>
      {/* ---------- Hero ---------- */}
      <section
        id="hero"
        className="relative flex min-h-[85svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center"
      >
        <StageBackdrop image={oklahomaImage} alt="" />
        {/* z-10: above the video and its tint, but below the menu drawer */}
        <Image
          src={logo}
          alt="Show Choir"
          priority
          className="absolute right-3 top-3 z-10 h-auto w-24 md:right-8 md:top-5 md:w-36"
        />
        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center">
          <p className="m-0 rounded-full border border-lightGold bg-black/50 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-lightGold md:px-4 md:text-base md:tracking-[0.2em]">
            No auditions. All welcome.
          </p>
          <h1 className={`${styles.display} mt-5`}>
            <span className="block text-3xl text-white md:text-5xl">
              Show Choir
            </span>
            <span
              className={`${styles.heroTitleSplit} ${styles.goldText} block`}
            >
              {town}
            </span>
          </h1>

          {/* when they rehearse, printed as a theatre ticket */}
          {choirDayOfWeek && (
            <div
              className={`${styles.ticket} my-7 w-full max-w-xl px-7 py-3 text-black`}
            >
              <div className="border-y-2 border-dashed border-black/40 py-3">
                <p className="m-0 text-xs font-bold uppercase leading-tight tracking-widest text-black/70">
                  {startText ?? "Rehearsals"}
                </p>
                <p
                  className={`${styles.display} m-0 text-3xl text-black md:text-4xl`}
                >
                  Every {choirDayOfWeek}
                </p>
                {time && (
                  <p className="m-0 text-sm font-bold leading-snug text-black md:text-base">
                    {time}
                  </p>
                )}
              </div>
            </div>
          )}

          <BookButton />
        </div>
      </section>
      <Nav pathData={pathData} />

      <ScrollingBanner />

      <main className="w-full">
        {/* ---------- When and where ---------- */}
        <section className="bg-lightBlack px-4 pb-16 pt-24 md:px-10">
          <div className="mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2
                className={`${styles.display} ${styles.sectionTitle} mb-6 text-white`}
              >
                Find us <span className={styles.goldText}>in {town}</span>
              </h2>
              <address className="text-xl font-bold not-italic text-white">
                {venueAddress}
              </address>
              {/* optional in Contentful - only some choirs have one.
                  pre-line keeps the line breaks typed in Contentful */}
              {description && (
                <p className="mt-4 whitespace-pre-line text-lg text-gray-200">
                  {description}
                </p>
              )}
              {parking && (
                <div className="mt-6 flex items-start gap-4 rounded-2xl border-2 border-lightGold bg-black p-5">
                  <FontAwesomeIcon
                    className="mt-1 text-lightGold"
                    size="2xl"
                    icon={faSquareParking}
                  />
                  <div>
                    <h3
                      className={`${styles.display} mb-1 text-2xl text-lightGold`}
                    >
                      Parking
                    </h3>
                    <p className="m-0 text-gray-100">{parking}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4">
              {photoUrl && (
                <Image
                  alt={photo.fields.title}
                  src={`https:${photoUrl}`}
                  placeholder="blur"
                  // tiny base64 image in code as placeholder for larger image
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMiIhYCgAD5wG3R8/togAAAABJRU5ErkJggg=="
                  width={800}
                  height={743}
                  sizes="(max-width: 768px) 92vw, 45vw"
                  className="h-56 w-full rounded-2xl border-2 border-lightGold object-cover md:h-64"
                />
              )}
              {googleMap && (
                <iframe
                  title={`Map showing ${location}`}
                  src={`https://www.google.com/maps/d/u/0/embed?mid=${googleMap}`}
                  loading="lazy"
                  className="h-56 w-full rounded-2xl border-2 border-lightGold md:h-64"
                />
              )}
            </div>
          </div>
        </section>

        {/* ---------- Booking form ---------- */}
        <section
          id="book"
          className={`${styles.spotlight} relative scroll-mt-4 overflow-hidden bg-black px-4 pb-16 pt-20 md:px-10`}
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
              <span className={styles.goldText}>
                Your first one&apos;s free
              </span>
            </h2>
            <p className="mb-8 text-center text-xl text-white">
              Book your free taster and come and sing with us in {town}.
            </p>
            {/* this page's choir is already chosen in the form */}
            <BookTasterFrom venues={venues ?? []} defaultChoir={town} />
          </div>
        </section>
      </main>

      <Footer pathData={pathData} />

      <PhoneBookBar />
    </div>
  );
}
Venue.defaultProps = {
  currentPage: {
    location: "",
    photo: {
      fields: {
        title: "",
        file: {
          url: "",
        },
      },
    },
  },
  pathData: [],
  venues: [],
  monthlyPricePence: 3000,
};
export async function getStaticPaths() {
  // url paths from Contentful for dynamic page generation
  const response = await getVenueData();
  const { items } = response;
  const paths = items.map((item: { fields: { slug: string } }) => ({
    params: { venue: item.fields.slug },
  }));
  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const venueResponse = await getVenueData();
  // extract relevant data for each venue to array of objects
  const venues = venueResponse.items.map((venue) => ({
    location: venue.fields.location,
    photo: venue.fields.photo || {},
    address: venue.fields.address,
    // null, not undefined, when a choir has none - Next.js can't send
    // undefined from getStaticProps and the whole page fails
    description: venue.fields.description ?? null,
    choirDayOfWeek: venue.fields.choirDayOfWeek,
    order: venue.fields.order,
    time: venue.fields.time,
    parking: venue.fields.parking,
    googleMap: venue.fields.googleMap,
    slug: venue.fields.slug,
  }));

  // Get data for main menu
  const res = await getPageData();
  const { items } = res;
  const pathData = items.map((item: PathDataType) => ({
    slug: item.fields.slug,
    displayText: item.fields.displayText,
    order: item.fields.order,
  }));
  const currentPage = venues.find((item) => item.slug === params?.venue);
  // a choir removed from Contentful shows the "not found" page on its next
  // rebuild instead of failing
  if (!currentPage) {
    return { notFound: true, revalidate: CONTENTFUL_REVALIDATE_SECONDS };
  }
  return {
    props: {
      venues,
      pathData,
      currentPage,
      monthlyPricePence: Number(monthlyAmountPence()),
    },
    revalidate: CONTENTFUL_REVALIDATE_SECONDS,
  };
}

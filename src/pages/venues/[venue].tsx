import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { faSquareParking } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Image from "next/image";

import logo from "@/public/logo.png";
import oklahomaImage from "@/public/oklahoma.jpg";
import { ChoirHighlights } from "@/src/components/ChoirHighlights";
import {
  BeyondRehearsals,
  ChoirQuestions,
  ChoirTestimonials,
  FirstNight,
  FromAngela,
  JoinOptions,
  NoBarriers,
  OtherChoirs,
} from "@/src/components/ChoirSections";
import Footer from "@/src/components/Footer";
import BookTasterFrom from "@/src/components/forms/BookTasterForm";
import { jsonLdScript } from "@/src/components/JsonLd";
import { Nav } from "@/src/components/Navigation/Nav";
import { PageMeta } from "@/src/components/PageMeta";
import {
  BookButton,
  PhoneBookBar,
  ScrollingBanner,
  StageBackdrop,
} from "@/src/components/StageElements";
import { VenueDescription } from "@/src/components/VenueDescription";
import { useChoirStartDate } from "@/src/hooks/useChoirStart";
import { choirQuestions, GENERAL_QUESTIONS } from "@/src/lib/choirQuestions";
import {
  CONTENTFUL_REVALIDATE_SECONDS,
  getChoirHighlights,
  getHomePageData,
  getPageData,
  getVenueData,
  toChoirPhoto,
} from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";
import { membershipPrices } from "@/src/lib/membershipPrices";
import { withoutUndefined } from "@/src/lib/staticProps";
import {
  faqJsonLd,
  richTextLines,
  splitAddress,
  venueJsonLd,
} from "@/src/lib/structuredData";
import { parseTestimonials } from "@/src/lib/testimonials";
import { choirName, choirStartDate, listOfTowns } from "@/src/lib/venues";
import styles from "@/src/styles/stage.module.css";
import {
  ChoirHighlight,
  ChoirPhoto,
  PathDataType,
  VenueType,
} from "@/src/types/types";

type Props = {
  // a new choir's opening day as it was when the page was built (null once
  // it's open)
  builtStartDate?: string | null;
  currentPage?: VenueType;
  // every choir, for the booking form's dropdown
  venues?: VenueType[];
  pathData?: { slug: string; displayText: string; order: number }[];
  // in pounds, from the settings: monthly Direct Debit and a Flexi pack
  // (null when no Flexi price is set)
  monthlyPrice?: number;
  flexiPrice?: number | null;
  // this choir's performances and news, newest first (Contentful)
  highlights?: ChoirHighlight[];
  // pictures from inside the hall (the venue's "venuePhotos" in Contentful)
  venuePhotos?: ChoirPhoto[];
  // the home page's Disneyland and Kerry Ellis pictures
  disneyImageUrl?: string;
  kerryImageUrl?: string;
  // the picture shown when the page is shared, and given to search engines:
  // the venue's "ogImage", else its latest highlight photo (null = neither)
  shareImageUrl?: string | null;
  // optional venue fields in Contentful (null when not filled in)
  geo?: { lat: number; lon: number } | null;
  areasServed?: string[];
  testimonials?: string | null;
};
// displays a pre rendered page with details for a single venue
export default function Venue({
  builtStartDate,
  pathData,
  currentPage,
  venues,
  monthlyPrice = 30,
  flexiPrice,
  highlights,
  venuePhotos,
  disneyImageUrl,
  kerryImageUrl,
  shareImageUrl,
  geo,
  areasServed = [],
  testimonials,
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
  // a new choir's opening day, shown big in the hero until it has passed
  const startDate = useChoirStartDate(location, builtStartDate ?? null);
  // Contentful's location is "Show Choir <town>", which leads the title for
  // search; the description just needs the town
  const town = choirName(location);
  // the building's name, the first line of its address
  const { placeName: venueName } = splitAddress(richTextLines(address), town);
  const pageTitle = `${location} | No Audition Musical Theatre Choir in Surrey`;
  const pageDescription = `Join our friendly, no audition musical theatre choir in ${town}, Surrey.${
    choirDayOfWeek ? ` Rehearsals every ${choirDayOfWeek}` : ""
  }${time ? ` at ${time}` : ""}. Book a free taster session today.`;
  // getStaticProps gives an empty object to a choir with no photo
  const photoUrl = photo?.fields?.file?.url;
  // the questions near the end of the page: this choir's own facts first
  // (when, where, parking, cost), then the ones every choir page has. The
  // same list goes to search engines as FAQ data, so the two always match
  const questions = [
    ...choirQuestions({
      location,
      choirDayOfWeek,
      time,
      address,
      parking,
      monthlyPrice,
      flexiPrice: flexiPrice ?? undefined,
    }),
    ...GENERAL_QUESTIONS,
  ];
  // Angela started the first choir in Banstead, so that page says so
  const angelaClosing =
    town === "Banstead"
      ? "It's where it all began, and she'd love to see you there."
      : `Today there are Show Choirs across Surrey, and she'd love to see you in ${town}.`;
  return (
    <div className="flex flex-col overflow-x-hidden bg-black">
      <PageMeta
        title={pageTitle}
        description={pageDescription}
        path={`/venues/${slug}`}
        // a photo of the choir when shared, not the building; otherwise the
        // site's usual stage picture
        image={shareImageUrl ?? undefined}
      />
      <Head>
        {/* where, when and how much, for search engines and AI tools */}
        {jsonLdScript(
          venueJsonLd({
            location,
            slug,
            address,
            summary: pageDescription,
            monthlyPricePence: Math.round(monthlyPrice * 100),
            flexiPricePence: flexiPrice
              ? Math.round(flexiPrice * 100)
              : undefined,
            image:
              shareImageUrl ?? (photoUrl ? `https:${photoUrl}` : undefined),
            geo: geo ?? undefined,
            areasServed,
          })
        )}
        {/* the questions and answers shown on the page - its own key, or
            Head would keep only one of the two */}
        {jsonLdScript(faqJsonLd(questions), "jsonld-faq")}
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
            {startDate
              ? "New choir. Opening soon!"
              : "No auditions. All welcome."}
          </p>
          {/* the spaces between the lines matter: without them search
              engines read the heading as "Show ChoirBanstead" */}
          <h1 className={`${styles.display} mt-5`}>
            <span className="block text-3xl text-white md:text-5xl">
              Show Choir
            </span>{" "}
            <span
              className={`${styles.heroTitleSplit} ${styles.goldText} block`}
            >
              {town}
            </span>{" "}
            <span className="font-sans mt-2 block text-base font-bold normal-case tracking-normal text-white md:text-xl">
              A no audition musical theatre choir
            </span>
          </h1>

          {/* when they rehearse, printed as a theatre ticket */}
          {choirDayOfWeek && (
            <div
              className={`${styles.ticket} my-7 w-full max-w-xl px-7 py-3 text-black`}
            >
              <div className="border-y-2 border-dashed border-black/40 py-3">
                {/* a choir that hasn't opened yet leads with its opening
                    night, big, and its usual night underneath */}
                {startDate ? (
                  <>
                    <p className="m-0 text-sm font-bold uppercase leading-tight tracking-widest text-black/70 md:text-base">
                      Opening night
                    </p>
                    <p
                      className={`${styles.display} m-0 text-4xl text-black md:text-6xl`}
                    >
                      {startDate}
                    </p>
                    <p className="m-0 text-sm font-bold uppercase leading-tight tracking-widest text-black/70">
                      Then every {choirDayOfWeek}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="m-0 text-xs font-bold uppercase leading-tight tracking-widest text-black/70">
                      Rehearsals
                    </p>
                    <p
                      className={`${styles.display} m-0 text-3xl text-black md:text-4xl`}
                    >
                      Every {choirDayOfWeek}
                    </p>
                  </>
                )}
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
        <NoBarriers />

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
              {/* optional in Contentful - only some choirs have one */}
              {description && <VenueDescription text={description} />}
              {/* nearby places, so people searching from them find us */}
              {areasServed.length > 0 && (
                <p className="mt-4 text-lg text-gray-100">
                  Members come from {town}, {listOfTowns(areasServed)}.
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
            {/* content-start: keeps the map right under the photos when the
                text beside them is longer, instead of spreading them apart */}
            <div className="grid content-start gap-4">
              {/* pictures from inside the hall if the choir has them,
                  otherwise its one photo */}
              {venuePhotos && venuePhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {venuePhotos.slice(0, 4).map((venuePhoto, index) => (
                    <Image
                      key={venuePhoto.url}
                      src={venuePhoto.url}
                      alt={venuePhoto.alt}
                      width={venuePhoto.width}
                      height={venuePhoto.height}
                      sizes="(max-width: 768px) 46vw, 22vw"
                      // one picture fills the row; with three, the first
                      // does. All 3:2 (a normal landscape photo), so little
                      // is cut off
                      className={`aspect-[3/2] h-auto w-full rounded-2xl border-2 border-lightGold object-cover ${
                        venuePhotos.length === 1 ||
                        (venuePhotos.length === 3 && index === 0)
                          ? "col-span-2"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              ) : (
                photoUrl && (
                  <Image
                    // says which building it is, from the address, rather than
                    // the photo's title in Contentful ("Dorking Show Choir Venue")
                    alt={`${venueName ?? town}, where Show Choir ${town} meets`}
                    src={`https:${photoUrl}`}
                    placeholder="blur"
                    // tiny base64 image in code as placeholder for larger image
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMiIhYCgAD5wG3R8/togAAAABJRU5ErkJggg=="
                    width={800}
                    height={743}
                    sizes="(max-width: 768px) 92vw, 45vw"
                    className="h-56 w-full rounded-2xl border-2 border-lightGold object-cover md:h-64"
                  />
                )
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

        <FirstNight town={town} />

        <ChoirHighlights town={town} highlights={highlights ?? []} />

        <ChoirTestimonials
          town={town}
          testimonials={parseTestimonials(testimonials)}
        />

        <BeyondRehearsals
          disneyImageUrl={disneyImageUrl}
          kerryImageUrl={kerryImageUrl}
        />

        <FromAngela closing={angelaClosing} />

        <JoinOptions
          monthlyPrice={monthlyPrice}
          flexiPrice={flexiPrice ?? undefined}
        />

        <ChoirQuestions questions={questions} />

        <OtherChoirs venues={venues ?? []} currentSlug={slug} />

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
              <span className={styles.goldText}>Curtain up, {town}!</span>
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
  builtStartDate: null,
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
  highlights: [],
  venuePhotos: [],
  monthlyPrice: 30,
  flexiPrice: null,
  disneyImageUrl: "",
  kerryImageUrl: "",
  shareImageUrl: null,
  geo: null,
  areasServed: [],
  testimonials: null,
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
  const [venueResponse, homeResponse] = await Promise.all([
    getVenueData(),
    // the Disneyland and Kerry Ellis pictures are the home page's own
    getHomePageData(),
  ]);
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
  const entry = venueResponse.items.find(
    (venue) => venue.fields.slug === params?.venue
  );
  const town = choirName(currentPage.location);
  const { placeName } = splitAddress(richTextLines(currentPage.address), town);
  // pictures from inside the hall; the alt text is each picture's
  // Description in Contentful, or this
  const venuePhotos = (entry?.fields.venuePhotos ?? [])
    .map((asset) =>
      toChoirPhoto(
        asset,
        `Inside ${placeName ?? "the hall"}, where Show Choir ${town} meets`
      )
    )
    .filter((venuePhoto): venuePhoto is ChoirPhoto => venuePhoto !== null);
  const highlights = entry?.sys?.id
    ? await getChoirHighlights(entry.sys.id)
    : [];
  // shared on Facebook etc: the venue's own pick, else its latest
  // highlight's first photo
  const ogImageUrl = entry?.fields.ogImage?.fields?.file?.url;
  const shareImageUrl = ogImageUrl
    ? `https:${ogImageUrl}`
    : highlights[0]?.photos[0]?.url ?? null;
  const { geo, areasServed, testimonials } = entry?.fields ?? {};
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
      currentPage,
      // a new choir's opening day (null once it's open)
      builtStartDate: choirStartDate(currentPage.location),
      highlights,
      venuePhotos,
      disneyImageUrl: home.fields.contentOneImage?.fields.file.url ?? "",
      kerryImageUrl: home.fields.contentTwoImage?.fields.file.url ?? "",
      shareImageUrl,
      // only real coordinates (Contentful's Location field is { lat, lon })
      geo:
        typeof geo?.lat === "number" && typeof geo?.lon === "number"
          ? { lat: geo.lat, lon: geo.lon }
          : null,
      areasServed: (areasServed ?? [])
        .map((area) => area.trim())
        .filter(Boolean),
      testimonials: testimonials ?? null,
      ...membershipPrices(),
    }),
    revalidate: CONTENTFUL_REVALIDATE_SECONDS,
  };
}

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import angeImage from "@/public/ange-half-length.png";
import fringeImage from "@/public/fringe-steps.jpg";
import glitterImage from "@/public/glitter-from-sky.png";
import logo from "@/public/logo.png";
import oklahomaImage from "@/public/oklahoma.jpg";
import Footer from "@/src/components/Footer";
import BookTasterFrom from "@/src/components/forms/BookTasterForm";
import { PageMeta } from "@/src/components/PageMeta";
import QuestionAndAnswer from "@/src/components/QuestionAndAnswer";
import {
  BookButton,
  PhoneBookBar,
  ScrollingBanner,
  StageBackdrop,
} from "@/src/components/StageElements";
import {
  CONTENTFUL_REVALIDATE_SECONDS,
  getHomePageData,
  getPageData,
  getVenueData,
} from "@/src/lib/contentfulClient";
import { choirName } from "@/src/lib/venues";
import styles from "@/src/styles/stage.module.css";
import { PathDataType, VenueType } from "@/src/types/types";

// Landing page for the Facebook ad about the new Walton-on-Thames choir, at
// /walton. It's a file of its own rather than a Contentful page, which is what
// keeps it out of the main menu and the sitemap (both are built from Contentful).
// There's deliberately no menu on it, so people who clicked the ad stay on the
// way to the booking form; the footer still links to the rest of the site.
//
// After the campaign, just delete this file: its styling (styles/stage.module.css,
// components/StageElements.tsx) and video (public/hero.mp4) are shared with the
// home page.

// As spelt in Contentful's venue, without "Show Choir" (lib/venues.ts choirName)
const WALTON = "Walton on Thames";
// 8pm on launch night (January, so UK time is the same as UTC)
const LAUNCH = new Date("2027-01-19T20:00:00Z");
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const noBarriers = [
  {
    title: "No auditions",
    text: "Not one. If you love to sing there's a place for you, even if you think you can't.",
  },
  {
    title: "No reading music",
    text: "We don't use sheet music. You get the lyrics, and we teach everything by ear, call and response.",
  },
  {
    title: "No singing alone",
    text: "You never have to sing on your own. It's all about being part of a group (although if you'd love a solo, there are plenty of chances!)",
  },
  {
    title: "No experience",
    text: "So many of our members had hardly sung since school. All you need is a bottle of water and a sense of humour.",
  },
];

const acts = [
  {
    act: "Act one",
    title: "Book your free taster",
    text: "Fill in the form on this page or give Angela a call. That's the hard part over.",
  },
  {
    act: "Act two",
    title: "Walk in the door",
    text: "You'll get a warm welcome, your lyrics, and help settling into a section you're happy with. Coming on your own? Plenty of us did.",
  },
  {
    act: "Act three",
    title: "Warm up and sing",
    text: "A few fun warm-ups, then we learn 4-5 songs together. Some you'll know, some will be new. We keep it relaxed. It's supposed to be fun, after all!",
  },
  {
    act: "Finale",
    title: "Go home buzzing",
    text: "You'll leave lighter, with a smile on your face and a song stuck in your head. Members get recordings and lyrics to sing along to at home.",
  },
];

const faqs = [
  {
    question: "I want to sing but I don't know if I can?",
    answer:
      "That's exactly why Show Choir was set up, to give everyone the chance to sing no matter how much or how little they've done before. Singing is all about practice, so come regularly and you'll be singing like a lark in no time!",
  },
  {
    question: "What if I come on my own and don't know anyone?",
    answer:
      "We're a very friendly bunch and we all remember our first rehearsal! You'll get a warm welcome from the choir and the leader, and you'll be so busy singing you'll forget to think about it.",
  },
  {
    question: "Do I have to perform?",
    answer:
      "No, performing is always optional. You can come along to rehearsals and never set foot on a stage. Although Show Choir is such a confidence booster that you might find your inner diva or divo, and we'll have to drag you off that stage!",
  },
  {
    question: "How do I learn all the songs?",
    answer:
      "We learn at rehearsals by ear and repetition. We also provide lyrics and recordings of all the songs for you to sing along to at home.",
  },
];

const monthlyPoints = [
  "Come to as many rehearsals as you like",
  "Try any of our choirs across Surrey at no extra cost",
  "The cheapest way to get your singing fix",
  "No tie-in, cancel any time",
];

const flexiPoints = [
  "£85 for concessions",
  "Works out at £9.50 a session (£8.50 for concessions)",
  "Only pay for what you use, one session each time you come",
  "Ideal if you need to take lots of breaks",
];

type Props = {
  // One choir only: the form's dropdown lists what it's given, and everyone
  // here came for Walton. An array so the form can be handed it unchanged
  venues: VenueType[];
  pathData: { slug: string; displayText: string; order: number }[];
  disneyImageUrl: string;
  kerryImageUrl: string;
};

// The points on a membership card
function PriceList({ items }: { items: string[] }) {
  return (
    <ul className="mb-6 mt-4 list-none">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="text-lightGold">
            ✦
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function Walton({
  venues,
  pathData,
  disneyImageUrl,
  kerryImageUrl,
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
        {/* ---------- How the choir works ---------- */}
        <section
          className={`${styles.spotlight} px-4 pb-16 pt-24 md:px-10 md:pt-32`}
        >
          <div className="mx-auto max-w-6xl">
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-4 text-center text-white`}
            >
              The small print.{" "}
              <span className={styles.goldText}>There isn&apos;t any.</span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-gray-200">
              Whether you&apos;re dreaming of Broadway stardom or you&apos;ve
              never sung a note outside the shower, you&apos;re exactly who
              we&apos;re looking for.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {noBarriers.map(({ title: cardTitle, text }) => (
                <div
                  key={cardTitle}
                  className="rounded-2xl border-2 border-lightGold bg-lightBlack p-6 transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]"
                >
                  <h3
                    className={`${styles.display} mb-3 text-3xl text-lightGold`}
                  >
                    {cardTitle}
                  </h3>
                  <p className="m-0 text-gray-100">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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

        {/* ---------- A first rehearsal, as a theatre programme ---------- */}
        <section className="bg-black px-4 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-4xl rounded-3xl border-4 border-double border-lightGold p-6 md:p-12">
            <p className="m-0 text-center text-sm font-bold uppercase tracking-[0.3em] text-lightGold">
              Tonight&apos;s programme
            </p>
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-10 mt-3 text-center text-white`}
            >
              Your first night
            </h2>
            <ol className="m-0 list-none p-0">
              {acts.map(({ act, title: actTitle, text }) => (
                <li
                  key={act}
                  className="mt-0 grid gap-1 border-t border-lightGold/40 py-6 md:grid-cols-[9rem_1fr] md:gap-6"
                >
                  <span className="font-heading text-2xl text-lightGold">
                    {act}
                  </span>
                  <span>
                    <span
                      className={`${styles.display} block text-3xl text-white`}
                    >
                      {actTitle}
                    </span>
                    <span className="mt-2 block leading-7 text-gray-200">
                      {text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Performances, holidays and the good bits ---------- */}
        <section className="bg-lightBlack px-4 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-4 text-center text-white`}
            >
              It doesn&apos;t stop at{" "}
              <span className={styles.goldText}>rehearsals</span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-gray-200">
              Every bit of this is optional, and all of it is unforgettable.
            </p>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Big theatre performances: the widest, most eye-catching tile */}
              <article className="relative min-h-[26rem] overflow-hidden rounded-3xl border-2 border-lightGold md:col-span-2">
                <Image
                  src={oklahomaImage}
                  alt="Show Choir on a theatre stage under green and gold lights, singing from Oklahoma"
                  fill
                  placeholder="blur"
                  sizes="(max-width: 768px) 92vw, 66vw"
                  className="object-cover"
                />
                <div className="via-black/85 absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6 pt-20">
                  <h3
                    className={`${styles.display} mb-2 text-4xl text-lightGold md:text-5xl`}
                  >
                    Big theatre shows
                  </h3>
                  <p className="m-0 text-lg text-white">
                    The lights, the music, the roar of the crowd. Members who
                    had hardly sung since school are now confidently belting out
                    West End hits to audiences of up to 5,000 people.
                  </p>
                </div>
              </article>

              {/* Local performances */}
              <article className="flex flex-col justify-center rounded-3xl bg-lightGold p-7">
                <h3 className={`${styles.display} mb-3 text-4xl text-black`}>
                  Local performances
                </h3>
                <p className="m-0 text-lg text-black">
                  From local theatres to outdoor events, your friends and family
                  will get to see you shine close to home. We love an outdoor
                  performance!
                </p>
              </article>

              {/* Holidays */}
              <article className="flex flex-col rounded-3xl border-2 border-lightGold bg-black p-7">
                <div className="mb-5 flex justify-center">
                  {disneyImageUrl && (
                    <Image
                      src={`https:${disneyImageUrl}`}
                      alt="The Disneyland Paris castle lit up at night"
                      width={220}
                      height={220}
                      className="h-44 w-44 rounded-full object-cover"
                    />
                  )}
                </div>
                <h3
                  className={`${styles.display} mb-3 text-4xl text-lightGold`}
                >
                  Singing holidays
                </h3>
                <p className="m-0 text-lg text-gray-100">
                  We&apos;ve opened the Christmas celebrations at Disneyland
                  Paris and toured the hills of Salzburg for The Sound of Music,
                  with many more adventures to come!
                </p>
              </article>

              {/* Edinburgh Fringe */}
              <article className="relative min-h-[26rem] overflow-hidden rounded-3xl border-2 border-lightGold">
                <Image
                  src={fringeImage}
                  alt="Show Choir members with their hands in the air on the steps of a venue at the Edinburgh Fringe"
                  fill
                  placeholder="blur"
                  sizes="(max-width: 768px) 92vw, 33vw"
                  className="object-cover"
                />
                <div className="via-black/85 absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6 pt-20">
                  <h3
                    className={`${styles.display} mb-2 text-4xl text-lightGold`}
                  >
                    The Edinburgh Fringe
                  </h3>
                  <p className="m-0 text-lg text-white">Yes, really. Twice!</p>
                </div>
              </article>

              {/* Stars and workshops */}
              <article className="flex flex-col rounded-3xl border-2 border-lightGold bg-black p-7">
                <div className="mb-5 flex justify-center">
                  {kerryImageUrl && (
                    <Image
                      src={`https:${kerryImageUrl}`}
                      alt="West End star Kerry Ellis"
                      width={220}
                      height={220}
                      className="h-44 w-44 rounded-full bg-white object-cover"
                    />
                  )}
                </div>
                <h3
                  className={`${styles.display} mb-3 text-4xl text-lightGold`}
                >
                  Sing with the stars
                </h3>
                <p className="m-0 text-lg text-gray-100">
                  Workshops with West End pros like Kerry Ellis and Joseph
                  Claus. We&apos;ve also sung with Robbie Williams, Beyond the
                  Barricade, Tenors Unlimited and the Loose Women!
                </p>
              </article>

              {/* Friends and feeling good */}
              <article className="flex flex-col items-center gap-6 rounded-3xl border-2 border-lightGold bg-black p-7 md:col-span-3 md:flex-row">
                <Image
                  src={glitterImage}
                  alt="The whole choir with arms raised under a shower of gold confetti"
                  placeholder="blur"
                  sizes="(max-width: 768px) 80vw, 320px"
                  className="h-auto w-64 shrink-0 rounded-full md:w-80"
                />
                <div>
                  <h3
                    className={`${styles.display} mb-3 text-4xl text-lightGold md:text-5xl`}
                  >
                    And the best bit?
                  </h3>
                  <p className="m-0 text-xl text-gray-100">
                    The feel-good factor. Our singers say that even on days
                    they&apos;ve dragged themselves along feeling tired and
                    stressed, they leave feeling lighter and smiling. Add in
                    choir trips to West End shows and friendships that last for
                    life, and you&apos;ll see why Show Choir is a singing
                    family.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- A word from Angela ---------- */}
        <section className="bg-black px-4 pt-16 md:px-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row md:items-end">
            <Image
              src={angeImage}
              alt="Angela Mackenzie, founder of Show Choir"
              sizes="(max-width: 768px) 60vw, 280px"
              className="h-auto w-56 shrink-0 md:w-72"
            />
            <div className="pb-8 text-center md:text-left">
              <p className="m-0 font-heading text-2xl leading-snug text-lightGold md:text-3xl">
                &ldquo;I believe that everyone can sing, and that&apos;s why I
                started Show Choir.&rdquo;
              </p>
              <p className="text-lg text-gray-200">
                A former professional opera singer, Angela started the first
                Show Choir in Banstead in 2014. Now she&apos;s bringing it to
                Walton-on-Thames, and she&apos;d love to see you there.
              </p>
              <p className="m-0 text-sm italic text-gray-400">
                Angela Mackenzie, Show Choir founder
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Membership ---------- */}
        <section className={`${styles.spotlight} px-4 py-16 md:px-10 md:py-24`}>
          <div className="mx-auto max-w-4xl">
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-4 text-center text-white`}
            >
              Your first one&apos;s{" "}
              <span className={styles.goldText}>free</span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-gray-200">
              Come to a free taster and see what you think. If you love it (we
              bet you will), there are two ways to join.
            </p>
            <div className="grid items-stretch gap-6 md:grid-cols-2">
              <div className="relative flex flex-col rounded-3xl border-4 border-lightGold bg-black p-7">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-lightGold px-4 py-1 text-sm font-bold uppercase tracking-wide text-black">
                  Most popular
                </span>
                <h3 className={`${styles.display} text-3xl text-white`}>
                  Monthly Direct Debit
                </h3>
                <p className="m-0 mt-3 flex items-baseline gap-2">
                  <span className={`${styles.display} text-6xl text-lightGold`}>
                    £30
                  </span>
                  <span className="text-lg text-gray-300">a month</span>
                </p>
                <PriceList items={monthlyPoints} />
                <Link
                  href="/monthly-membership"
                  className="mt-auto rounded-md border-2 border-lightGold py-2 text-center text-white hover:bg-lightGold hover:text-black"
                >
                  Join monthly
                </Link>
              </div>
              <div className="flex flex-col rounded-3xl border-2 border-lightGold/60 bg-black p-7">
                <h3 className={`${styles.display} text-3xl text-white`}>
                  Flexi
                </h3>
                <p className="m-0 mt-3 flex items-baseline gap-2">
                  <span className={`${styles.display} text-6xl text-lightGold`}>
                    £95
                  </span>
                  <span className="text-lg text-gray-300">for 10 sessions</span>
                </p>
                <PriceList items={flexiPoints} />
                <Link
                  href="/flexi-membership"
                  className="mt-auto rounded-md border-2 border-lightGold py-2 text-center text-white hover:bg-lightGold hover:text-black"
                >
                  Join Flexi
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Questions ---------- */}
        <section className="bg-black px-4 py-16 md:px-10">
          <div className="mx-auto max-w-3xl">
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-8 text-center text-white`}
            >
              I know what you&apos;re thinking...
            </h2>
            {faqs.map(({ question, answer }) => (
              <QuestionAndAnswer
                key={question}
                question={question}
                answer={answer}
              />
            ))}
          </div>
        </section>

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
    props: {
      venues,
      pathData,
      disneyImageUrl: home.fields.contentOneImage?.fields.file.url ?? "",
      kerryImageUrl: home.fields.contentTwoImage?.fields.file.url ?? "",
    },
    revalidate: CONTENTFUL_REVALIDATE_SECONDS,
  };
}

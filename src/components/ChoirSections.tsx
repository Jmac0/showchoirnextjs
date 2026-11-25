import Image from "next/image";
import Link from "next/link";
import React from "react";

import angeImage from "@/public/ange-half-length.png";
import fringeImage from "@/public/fringe-steps.jpg";
import glitterImage from "@/public/glitter-from-sky.png";
import oklahomaImage from "@/public/oklahoma.jpg";
import QuestionAndAnswer from "@/src/components/QuestionAndAnswer";
import { formatPounds, Question } from "@/src/lib/choirQuestions";
import { Testimonial } from "@/src/lib/testimonials";
import styles from "@/src/styles/stage.module.css";

// The sections that tell people what Show Choir is like: used on every
// choir's page (pages/venues/[venue].tsx) and the Walton launch page. They
// started on the Walton page; sharing them gives each choir page real
// substance for visitors, search engines and AI tools, not just an address
// and a form. Wording that names a town takes it as a prop, so each page
// reads as its own.

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

// "The small print. There isn't any." - the four things people worry about
export function NoBarriers() {
  return (
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
          Whether you&apos;re dreaming of Broadway stardom or you&apos;ve never
          sung a note outside the shower, you&apos;re exactly who we&apos;re
          looking for.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {noBarriers.map(({ title, text }) => (
            <div
              key={title}
              className="rounded-2xl border-2 border-lightGold bg-lightBlack p-6 transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]"
            >
              <h3 className={`${styles.display} mb-3 text-3xl text-lightGold`}>
                {title}
              </h3>
              <p className="m-0 text-gray-100">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// A first rehearsal, as a theatre programme. With a town, the "walk in the
// door" act names it, so the page reads as that choir's
export function FirstNight({ town }: { town?: string }) {
  const acts = [
    {
      act: "Act one",
      title: "Book your free taster",
      text: "Fill in the form on this page or give Angela a call. That's the hard part over.",
    },
    {
      act: "Act two",
      title: town ? `Walk in the door in ${town}` : "Walk in the door",
      text: "You'll get a warm welcome, your lyrics, and help settling into a section you're happy with. Coming on your own? Plenty of us did.",
    },
    {
      act: "Act three",
      title: "Warm up and sing",
      text: "A few fun warm-ups, then we learn four or five songs together. Some you'll know, some will be new. We keep it relaxed. It's supposed to be fun, after all!",
    },
    {
      act: "Finale",
      title: "Go home buzzing",
      text: "You'll leave lighter, with a smile on your face and a song stuck in your head. Members get recordings and lyrics to sing along to at home.",
    },
  ];

  return (
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
          {acts.map(({ act, title, text }) => (
            <li
              key={act}
              className="mt-0 grid gap-1 border-t border-lightGold/40 py-6 md:grid-cols-[9rem_1fr] md:gap-6"
            >
              <span className="font-heading text-2xl text-lightGold">
                {act}
              </span>
              <span>
                <span className={`${styles.display} block text-3xl text-white`}>
                  {title}
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
  );
}
FirstNight.defaultProps = { town: undefined };

type BeyondRehearsalsProps = {
  // the home page's Disneyland and Kerry Ellis pictures, from Contentful
  // (getHomePageData) - left out if missing
  disneyImageUrl?: string;
  kerryImageUrl?: string;
};

// Performances, holidays and the good bits - what the whole of Show Choir
// does together
export function BeyondRehearsals({
  disneyImageUrl,
  kerryImageUrl,
}: BeyondRehearsalsProps) {
  return (
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
                The lights, the music, the roar of the crowd. Members who had
                hardly sung since school are now confidently belting out West
                End hits to audiences of up to 5,000 people.
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
            <h3 className={`${styles.display} mb-3 text-4xl text-lightGold`}>
              Singing holidays
            </h3>
            <p className="m-0 text-lg text-gray-100">
              We&apos;ve opened the Christmas celebrations at Disneyland Paris
              and toured the hills of Salzburg for The Sound of Music, with many
              more adventures to come!
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
              <h3 className={`${styles.display} mb-2 text-4xl text-lightGold`}>
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
            <h3 className={`${styles.display} mb-3 text-4xl text-lightGold`}>
              Sing with the stars
            </h3>
            <p className="m-0 text-lg text-gray-100">
              Workshops with West End pros like Kerry Ellis and Joseph Claus.
              We&apos;ve also sung with Robbie Williams, Beyond the Barricade,
              Tenors Unlimited and the Loose Women!
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
                stressed, they leave feeling lighter and smiling. Add in choir
                trips to West End shows and friendships that last for life, and
                you&apos;ll see why Show Choir is a singing family.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
BeyondRehearsals.defaultProps = {
  disneyImageUrl: undefined,
  kerryImageUrl: undefined,
};

// A word from Angela. `closing` is the page's own last line, e.g. "Now
// she's bringing it to Walton-on-Thames, and she'd love to see you there."
export function FromAngela({ closing }: { closing: string }) {
  return (
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
            A former professional opera singer, Angela started the first Show
            Choir in Banstead in 2014. {closing}
          </p>
          <p className="m-0 text-sm italic text-gray-400">
            Angela Mackenzie, Show Choir founder
          </p>
        </div>
      </div>
    </section>
  );
}

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

type JoinOptionsProps = {
  // in pounds: the monthly Direct Debit, and a 10-session Flexi pack. The
  // page gets them from the settings (env), so a price change needs no edit
  // here. No Flexi price, no Flexi card
  monthlyPrice: number;
  flexiPrice?: number;
};

// The two ways to join, after the free taster. Concession Flexi isn't
// offered to new members (lib/stripe/flexiProducts.ts), so it isn't shown
export function JoinOptions({ monthlyPrice, flexiPrice }: JoinOptionsProps) {
  const monthlyPoints = [
    "Come to as many rehearsals as you like",
    "Try any of our choirs across Surrey at no extra cost",
    "The cheapest way to get your singing fix",
    "No tie-in, cancel any time",
  ];
  const flexiPoints = flexiPrice
    ? [
        `Works out at ${formatPounds(flexiPrice / 10)} a session`,
        "Only pay for what you use, one session each time you come",
        "Ideal if you need to take lots of breaks",
      ]
    : [];

  return (
    <section className={`${styles.spotlight} px-4 py-16 md:px-10 md:py-24`}>
      <div className="mx-auto max-w-4xl">
        <h2
          className={`${styles.display} ${styles.sectionTitle} mb-4 text-center text-white`}
        >
          Your first one&apos;s <span className={styles.goldText}>free</span>
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-gray-200">
          Come to a free taster and see what you think. If you love it (we bet
          you will), there are two ways to join.
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
                {formatPounds(monthlyPrice)}
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
          {flexiPrice ? (
            <div className="flex flex-col rounded-3xl border-2 border-lightGold/60 bg-black p-7">
              <h3 className={`${styles.display} text-3xl text-white`}>Flexi</h3>
              <p className="m-0 mt-3 flex items-baseline gap-2">
                <span className={`${styles.display} text-6xl text-lightGold`}>
                  {formatPounds(flexiPrice)}
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
JoinOptions.defaultProps = { flexiPrice: undefined };

type ChoirQuestionsProps = {
  questions: Question[];
  title?: string;
};

// The questions, each opening to its answer. The answers are in the page's
// HTML even while closed, so search engines and AI tools read them
export function ChoirQuestions({
  questions,
  title = "I know what you're thinking...",
}: ChoirQuestionsProps) {
  return (
    <section className="bg-black px-4 py-16 md:px-10">
      <div className="mx-auto max-w-3xl">
        <h2
          className={`${styles.display} ${styles.sectionTitle} mb-8 text-center text-white`}
        >
          {title}
        </h2>
        {questions.map(({ question, answer }) => (
          <QuestionAndAnswer
            key={question}
            question={question}
            answer={answer}
          />
        ))}
      </div>
    </section>
  );
}
ChoirQuestions.defaultProps = {
  title: "I know what you're thinking...",
};

// What this choir's members say (the venue's "testimonials" in Contentful).
// Hidden when there are none
export function ChoirTestimonials({
  town,
  testimonials,
}: {
  town: string;
  testimonials: Testimonial[];
}) {
  if (!testimonials.length) return null;
  return (
    <section className="bg-lightBlack px-4 py-16 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h2
          className={`${styles.display} ${styles.sectionTitle} mb-10 text-center text-white`}
        >
          Don&apos;t just take <span className={styles.goldText}>our word</span>{" "}
          for it
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {testimonials.slice(0, 3).map(({ quote, name }) => (
            <figure
              key={quote}
              className="m-0 flex w-full flex-col justify-between rounded-3xl border-2 border-lightGold bg-black p-6 transition hover:shadow-[0_0_25px_rgba(222,204,120,0.45)] md:w-[calc(33.333%-1rem)]"
            >
              <blockquote className="m-0 font-heading text-2xl leading-snug text-lightGold">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm italic text-gray-300">
                {name ? `${name}, ` : ""}Show Choir {town}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// Links to the other choirs' pages, in the order set in Contentful, so a new
// choir appears here by itself. Helps people (and search engines) find the
// choir nearest them
export function OtherChoirs({
  venues,
  currentSlug,
}: {
  venues: { location: string; slug: string; order: number }[];
  currentSlug: string;
}) {
  const others = [...venues]
    .filter((venue) => venue.slug && venue.slug !== currentSlug)
    .sort((a, b) => a.order - b.order);
  if (!others.length) return null;
  return (
    <section className="bg-black px-4 pb-16 md:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className={`${styles.display} mb-6 text-4xl text-white`}>
          Other choirs <span className={styles.goldText}>near you</span>
        </h2>
        {/* one row on a computer (wrapping only if there are ever too many
            choirs to fit), stacked on a phone */}
        <ul className="m-0 flex list-none flex-col items-center gap-3 p-0 md:flex-row md:flex-wrap md:justify-center">
          {others.map((venue) => (
            <li key={venue.slug}>
              <Link
                href={`/venues/${venue.slug}`}
                className="block whitespace-nowrap rounded-full border-2 border-lightGold px-5 py-2 font-bold text-lightGold no-underline transition hover:bg-lightGold hover:text-black md:px-4 md:text-sm lg:text-base"
              >
                {venue.location}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

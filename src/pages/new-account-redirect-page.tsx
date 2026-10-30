import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import { getPageData } from "@/src/lib/contentfulClient";

import Footer from "../components/Footer";
import Logo from "../components/Logo";
import { Nav } from "../components/Navigation/Nav";
import { ScreenSparkleBurst } from "../components/SparkleBurst";
import { PageItemType } from "../types/types";

// Where a brand new member lands after joining: Stripe sends Flexi members
// here once they've paid (?joined=flexi, api/stripe/checkout_flexi.ts) and
// GoCardless sends Direct Debit members here once they've filled in its form
// (?joined=dd, api/gocardless/mandateflow.ts). Their welcome email, with the
// link to create their account, is on its way - this tells them what to do
// next.

type Step = { title: string; text: React.ReactNode };

function steps(joined?: string): Step[] {
  return [
    {
      title: "Check your email",
      text: (
        <>
          We&apos;ve sent you an email called{" "}
          <span className="text-white">&quot;Welcome to Show Choir&quot;</span>.
          It can take a few minutes - if it isn&apos;t there, have a look in
          your spam or promotions folder.
        </>
      ),
    },
    {
      title: "Create your account",
      text: "Click Create Account in the email and choose a password - you'll be logged straight in.",
    },
    {
      title: "Get the app",
      text: "Log in to the Show Choir app with the same email and password, for your membership card and all the music and lyrics we're learning.",
    },
    {
      title: "Come and sing!",
      text:
        joined === "flexi"
          ? "Come along to any of our choirs, any week - just show your membership card at the door and it uses one of your sessions."
          : "Come along to any of our choirs, any week - just show your membership card at the door.",
    },
  ];
}

function NewAccountRedirectPage({ pathData }: PageItemType) {
  const { query, isReady } = useRouter();
  const joined = typeof query.joined === "string" ? query.joined : undefined;

  // A big burst of gold sparkles to celebrate - started once the page is
  // showing in the browser, so it isn't over before they see it
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => setCelebrate(true), []);

  // The line under the heading, once we know how they joined (the page is
  // built in advance, so the address is only read in the browser)
  let intro = "";
  if (isReady && joined === "flexi") {
    intro =
      "Your payment has gone through and your 10 Flexi sessions are ready.";
  } else if (isReady && joined === "dd") {
    intro =
      "Thanks for setting up your Direct Debit - there's nothing to pay at the door.";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>Welcome to Show Choir</title>
        <meta
          name="Join Show Choir"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo color="gold" />
      <Nav pathData={pathData} />
      {celebrate ? <ScreenSparkleBurst /> : null}

      <main className="mb-12 mt-40 flex w-full flex-col items-center px-4 text-center md:mt-28">
        {/* --- Welcome --- */}
        <h1 className="p-0">Consider yourself one of the family!</h1>
        {/* Kept the same height before and after it fills in, so nothing jumps */}
        <p className="min-h-[1.75rem] max-w-xl text-lg text-gray-200">
          {intro}
        </p>

        {/* --- What happens next --- */}
        <section className="mt-8 w-full max-w-xl rounded-xl border-2 border-lightGold bg-gradient-to-br from-lightBlack/90 to-black/90 p-6 text-left shadow-lg shadow-lightGold/10 md:p-8">
          <ol className="flex flex-col gap-6">
            {steps(joined).map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lightGold text-lg font-bold text-black"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="p-0 text-lightGold">{step.title}</h3>
                  <p className="mt-1">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-6 max-w-xl text-sm text-gray-400">
          No email after half an hour?{" "}
          <Link className="underline hover:text-lightGold" href="/contact">
            Contact us
          </Link>{" "}
          and we&apos;ll sort it out.
        </p>

        {/* --- Sign-off from Ange --- */}
        <p className="mt-10 font-heading text-2xl text-lightGold">
          See you soon!
        </p>
        <Image
          src="/signature.png"
          // tiny file – resizing it on Vercel would cost more than it saves
          unoptimized
          alt="Ange"
          width={200}
          height={313}
          className="mt-2 h-auto w-24 md:w-28"
        />
      </main>
      <Footer pathData={pathData} />
    </div>
  );
}

export async function getStaticProps() {
  /* get paths for each page from Contentful */
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

  return { props: { pathData } };
}
export default NewAccountRedirectPage;

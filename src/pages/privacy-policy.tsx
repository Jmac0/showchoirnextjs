import Head from "next/head";
import Link from "next/link";
import React from "react";

import { getPageData } from "@/src/lib/contentfulClient";

import Footer from "../components/Footer";
import Logo from "../components/Logo";
import { Nav } from "../components/Navigation/Nav";
import { PageItemType } from "../types/types";

// The privacy policy. Linked from the footer, the app's Account screen and
// both app store listings (Apple and Google need a public web address for
// it). Written to match what the website and app actually collect - if a new
// service or form is added (e.g. analytics), update this page and the date.

const UPDATED = "1 November 2026";
const CONTACT_EMAIL = "info@show-choir.co.uk";

type Section = { title: string; body: React.ReactNode };

// Each section gets a link anchor made from its title, e.g. "Deleting your
// account" -> #deleting-your-account. The Google Play listing links straight
// to that one as the account deletion page, so don't rename it.
const anchorFor = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const mail = (
  <a
    className="underline hover:text-lightGold"
    href={`mailto:${CONTACT_EMAIL}`}
  >
    {CONTACT_EMAIL}
  </a>
);

const SECTIONS: Section[] = [
  {
    title: "Who we are",
    body: (
      <p>
        Show Choir is run by Angela Mackenzie, a sole trader trading as Show
        Choir. She is the &quot;data controller&quot; for the information
        described here - the person responsible for looking after it. For
        anything to do with your data, email {mail}.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <ul>
        <li>
          <b>When you join:</b> your name, address, phone number, email, home
          choir, that you&apos;re over 18, and your membership type (monthly
          Direct Debit or Flexi).
        </li>
        <li>
          <b>Your account:</b> your password (stored scrambled, so nobody can
          read it) and your membership details, such as Flexi sessions left and
          whether your Direct Debit is active.
        </li>
        <li>
          <b>Coming to choir:</b> when you&apos;re checked in at a rehearsal, we
          record which choir and when, and any payment taken at the door (cash,
          card or pay later).
        </li>
        <li>
          <b>Booking a taster session:</b> your name, email and the choir
          you&apos;d like to try, and whether you came along.
        </li>
        <li>
          <b>Contact and choir leader forms:</b> what you send us - your name,
          email and message, and for leader applications your phone number,
          town, postcode and the experience you tell us about.
        </li>
        <li>
          <b>Security:</b> to stop people guessing passwords, we briefly count
          failed logins by email address and internet (IP) address. These counts
          delete themselves automatically.
        </li>
      </ul>
    ),
  },
  {
    title: "Payments",
    body: (
      <p>
        Card payments are handled by <b>Stripe</b> and Direct Debits by{" "}
        <b>GoCardless</b>. You give your card or bank details to them, not us -
        we never see or store them. We only receive a record that you&apos;ve
        paid, so we can keep your membership up to date.
      </p>
    ),
  },
  {
    title: "What we use it for",
    body: (
      <ul>
        <li>
          Running your membership: letting you in at rehearsals, keeping track
          of Flexi sessions and Direct Debits, and giving you the music and
          lyrics we&apos;re learning (this is needed to provide the membership
          you&apos;ve signed up for).
        </li>
        <li>
          Emails about your membership, such as your welcome email, password
          resets and changes to your account.
        </li>
        <li>
          Our newsletter - news about the choirs, performances and events. You
          can unsubscribe at any time from the link at the bottom of every
          newsletter.
        </li>
        <li>Following up a taster session with information on how to join.</li>
        <li>
          Keeping the website and app secure, and keeping the business records
          the law requires (for example, payment records for tax).
        </li>
      </ul>
    ),
  },
  {
    title: "Our legal reasons",
    body: (
      <>
        <p>
          UK data protection law (the UK GDPR) asks us to say why we&apos;re
          allowed to use your information:
        </p>
        <ul>
          <li>
            <b>Contract</b> - to provide the membership or taster session you
            asked for.
          </li>
          <li>
            <b>Legitimate interests</b> - to keep our services secure, follow up
            taster bookings and tell members and former members about the choir
            (you can opt out at any time).
          </li>
          <li>
            <b>Legal obligation</b> - keeping financial records for HMRC.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Who else handles your data",
    body: (
      <>
        <p>
          We never sell your data or share it for anyone else&apos;s marketing.
          We use these companies to run the website, app and membership - they
          only use your data to provide their service to us:
        </p>
        <ul>
          <li>
            <b>Stripe</b> - card payments
          </li>
          <li>
            <b>GoCardless</b> - Direct Debits
          </li>
          <li>
            <b>Mailchimp</b> (Intuit) - our newsletter
          </li>
          <li>
            <b>Resend</b> - sending emails from the website
          </li>
          <li>
            <b>Vercel</b> - hosting the website
          </li>
          <li>
            <b>MongoDB Atlas</b> - our database, stored in Ireland
          </li>
          <li>
            <b>Cloudflare</b> - storing the music and lyrics files
          </li>
          <li>
            <b>Contentful</b> - the website&apos;s pages (no member data)
          </li>
          <li>
            <b>Google</b> - the maps on our choir pages and the website&apos;s
            fonts (see Cookies below)
          </li>
        </ul>
        <p>
          Some of these companies are based in the USA. Where your data leaves
          the UK, it&apos;s protected by the safeguards UK law requires, such as
          the UK-US &quot;data bridge&quot; or approved contract terms.
        </p>
      </>
    ),
  },
  {
    title: "The Show Choir app",
    body: (
      <ul>
        <li>The app uses the same account and information as the website.</li>
        <li>
          It keeps you logged in by storing a login key securely on your phone.
        </li>
        <li>
          The camera is only used by our welcome team to scan membership QR
          codes at the door - nothing is recorded or stored.
        </li>
        <li>
          The app has no adverts, doesn&apos;t track you and doesn&apos;t share
          your data with anyone else. Buying Flexi sessions in the app is
          handled by Stripe, as above.
        </li>
      </ul>
    ),
  },
  {
    title: "Cookies",
    body: (
      <>
        <p>
          We only use cookies the website needs to work: one keeps you logged in
          to your account, and Stripe uses its own when you pay. We don&apos;t
          use advertising or tracking cookies, or analytics.
        </p>
        <p>
          Pages with a map show a Google map, and the website loads a font from
          Google - so your browser contacts Google, which may set its own
          cookies (see{" "}
          <a
            className="underline hover:text-lightGold"
            href="https://policies.google.com/privacy"
          >
            Google&apos;s privacy policy
          </a>
          ).
        </p>
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <ul>
        <li>
          Your account and attendance - while you&apos;re a member, then for 6
          years after your membership ends (so you can easily rejoin), unless
          you delete your account sooner.
        </li>
        <li>Payment records - 6 years, as HMRC requires.</li>
        <li>Taster bookings and messages from our forms - up to 6 years.</li>
      </ul>
    ),
  },
  {
    title: "Deleting your account",
    body: (
      <p>
        You can delete your account at any time - in the app (Account, then
        Delete account) or by emailing {mail}. This removes your account and
        attendance history, and takes you off our newsletter. We only keep
        payment records the law requires. Deleting your account doesn&apos;t
        cancel a Direct Debit - you can do that with your bank or by contacting
        us.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>You have the right to:</p>
        <ul>
          <li>ask for a copy of the information we hold about you</li>
          <li>have anything wrong corrected</li>
          <li>have your information deleted</li>
          <li>object to, or ask us to limit, how we use it</li>
          <li>stop marketing emails at any time</li>
          <li>receive your information in a format you can take elsewhere</li>
        </ul>
        <p>
          Just email {mail} - we&apos;ll reply within a month. If you&apos;re
          unhappy with how we&apos;ve handled your data, please tell us first;
          you can also complain to the{" "}
          <a
            className="underline hover:text-lightGold"
            href="https://ico.org.uk/make-a-complaint/"
          >
            Information Commissioner&apos;s Office (ICO)
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "Children",
    body: (
      <p>
        Membership is for adults - you need to be over 18 to join, and the app
        is for members.
      </p>
    ),
  },
  {
    title: "Changes",
    body: (
      <p>
        If we change how we use your data, we&apos;ll update this page and the
        date at the top, and tell members about anything important.
      </p>
    ),
  },
];

function PrivacyPolicy({ pathData }: PageItemType) {
  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>Privacy policy | Show Choir</title>
        <meta
          name="description"
          content="How Show Choir looks after your personal information"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo color="gold" />
      <Nav pathData={pathData} />

      <main className="mb-12 mt-40 flex w-full flex-col items-center px-4 md:mt-28">
        <h1 className="p-0 text-center">Privacy policy</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated {UPDATED}</p>

        <article className="mt-8 flex w-full max-w-2xl flex-col gap-8 text-gray-200 [&_li]:mt-2 [&_p+p]:mt-3 [&_p+ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
          {SECTIONS.map((section) => (
            // scroll-mt keeps the heading clear of the fixed nav bar when
            // the page opens at an anchor
            <section
              key={section.title}
              id={anchorFor(section.title)}
              className="scroll-mt-40 md:scroll-mt-28"
            >
              <h2 className="p-0 text-2xl text-lightGold">{section.title}</h2>
              <div className="mt-2">{section.body}</div>
            </section>
          ))}
        </article>

        <p className="mt-10 text-sm text-gray-400">
          Questions?{" "}
          <Link className="underline hover:text-lightGold" href="/contact">
            Contact us
          </Link>{" "}
          or email {mail}.
        </p>
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
export default PrivacyPolicy;

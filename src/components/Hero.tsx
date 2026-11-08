import Image, { StaticImageData } from "next/image";
import React from "react";

import angelaChoirImage from "@/public/angela-choir.jpg";
import fringeImage from "@/public/fringe-steps.jpg";
import logo from "@/public/logo.png";
import {
  BookButton,
  ScrollingBanner,
  StageBackdrop,
} from "@/src/components/StageElements";
import { choirNames } from "@/src/lib/venues";
import styles from "@/src/styles/stage.module.css";
import { VenueType } from "@/src/types/types";

import StyledListComponent from "./StyledListComponent";

type Props = {
  bgImage: StaticImageData;
  heroListItems: string[];
  heroTextGreeting: React.ReactNode;
  venues?: VenueType[];
};

// The top of the home page: the full-screen hero with its video, then Ange's
// welcome and list, whose words are all from Contentful
export function Hero({
  bgImage,
  heroListItems,
  heroTextGreeting,
  venues = [],
}: Props) {
  return (
    <>
      <section
        id="hero"
        className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-black px-4 pb-16 pt-28 text-center lg:px-10 lg:pt-36"
      >
        <StageBackdrop image={bgImage} alt="image of choir signing" />
        {/* z-10: above the video and its tint, but below the menu drawer
            (Nav: z-30, its overlay z-[29], the menu button z-40) */}
        <Image
          src={logo}
          alt="show choir logo"
          priority
          className="absolute right-3 top-3 z-10 h-auto w-24 md:right-8 md:top-5 md:w-36"
        />
        {/* On a phone, top to bottom: headline, photos, the rest. From lg up, the
            photos fill the left-hand column beside the words */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-x-10 gap-y-5 lg:grid-cols-2 lg:text-left">
          <div className="flex flex-col items-center lg:col-start-2 lg:items-start lg:self-end">
            <p className="m-0 rounded-full border border-lightGold bg-black/50 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-lightGold md:px-4 md:text-base md:tracking-[0.2em]">
              No auditions. All welcome.
            </p>
            <h1
              className={`${styles.display} ${styles.heroTitleSplit} ${styles.goldText} mt-4`}
            >
              Find your
              <br />
              sparkle!
            </h1>
          </div>

          {/* Real people, smiling: the first thing anyone should see. The
              Edinburgh photo overlaps the corner of the main one, which is
              cropped a little on phones to keep the Book button on screen */}
          <div className="relative mx-auto w-full max-w-lg pb-12 pr-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:pb-20">
            <Image
              src={angelaChoirImage}
              alt="Angela, the founder of Show Choir, beaming with her arms in the air, with smiling choir members behind her"
              priority
              placeholder="blur"
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="aspect-[4/3] h-auto w-full rotate-1 rounded-2xl border-4 border-lightGold object-cover object-[50%_35%] shadow-[0_0_40px_rgba(222,204,120,0.45)] lg:aspect-auto"
            />
            <Image
              src={fringeImage}
              alt="A big group of choir members laughing with their hands in the air on the steps of a venue at the Edinburgh Fringe"
              placeholder="blur"
              sizes="(max-width: 1024px) 45vw, 22vw"
              className="absolute bottom-0 right-0 h-auto w-1/2 -rotate-3 rounded-2xl border-4 border-lightGold shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            />
          </div>

          <div className="flex flex-col items-center lg:col-start-2 lg:items-start lg:self-start">
            <p className="mb-5 mt-0 max-w-2xl text-xl font-bold leading-snug text-white md:text-2xl">
              Surrey&apos;s premier no-audition musical theatre choir. Come and
              have some singing fun!
            </p>
            <BookButton />
            {/* the free taster, printed as a theatre ticket */}
            <div
              className={`${styles.ticket} mt-7 w-full max-w-2xl px-7 py-3 text-center text-black`}
            >
              <div className="border-y-2 border-dashed border-black/40 py-3">
                <p className="m-0 text-xs font-bold uppercase leading-tight tracking-widest text-black/70">
                  Admit one
                </p>
                <p
                  className={`${styles.display} m-0 text-2xl text-black md:text-4xl`}
                >
                  Your first taster is free
                </p>
                {venues.length > 0 && (
                  <p className="m-0 text-sm font-bold leading-snug text-black md:text-base">
                    {choirNames(venues).join(" ✦ ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollingBanner />

      <section className={`${styles.spotlight} px-4 pb-16 pt-24 md:px-10`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row md:items-end">
          <div className="w-full md:w-2/3">
            <div className={styles.contentfulText}>{heroTextGreeting}</div>
            <p className="mb-0 mt-6 text-xl font-bold text-white">
              I&apos;d love to see you at Show Choir!
            </p>
            <Image
              src="/signature.png"
              // tiny file – resizing it on Vercel would cost more than it saves
              unoptimized
              alt="Ange"
              width={200}
              height={313}
              className="mt-3 h-auto w-24 md:w-32"
            />
          </div>
          <Image
            src="/ange-half-length.png"
            alt="Ange profile pic"
            width={413}
            height={513}
            sizes="(max-width: 768px) 70vw, 33vw"
            className="-mb-16 h-auto w-3/4 max-w-sm shrink-0 md:w-1/3"
          />
        </div>
      </section>

      <section className="relative bg-lightBlack px-4 py-16 md:px-10">
        <ul className="mx-auto mb-0 grid max-w-6xl list-none items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heroListItems.map((li: string) => (
            <StyledListComponent key={li} listText={li} />
          ))}
        </ul>
      </section>
    </>
  );
}

Hero.defaultProps = {
  venues: [],
};

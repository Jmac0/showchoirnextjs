import React from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import BookTasterPopUpForm from "./forms/BookTasterPopUpForm";
import { ContentBlocksType, VenueType } from "../types/types";

type Props = {
  videoUrl: string;
  heroTxt?: ContentBlocksType;
  subTxt?: string;
  isBookingOpen: boolean;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  venues?: VenueType[];
};

// renders paragraphs as plain spans (not <p>) so they inherit the h1's
// gold color / line-height instead of the global `p` styles in global.css
const heroHeadingFormatOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node: unknown, children: React.ReactNode) => (
      <span className="block">{children}</span>
    ),
  },
};

// full-width video background with a dark overlay, used behind hero headings
export function HeroVideo({
  videoUrl,
  heroTxt = undefined,
  subTxt = "",
  isBookingOpen,
  setIsBookingOpen,
  venues = [],
}: Props) {
  return (
    <section className="relative -mt-20 flex min-h-[70vh] w-full flex-col items-center justify-center  py-32 md:min-h-[85vh] md:py-48">
      <span className="relative z-50 flex flex-col items-center ">
        <h1 className="heading-impact text-center tracking-wide text-gold">
          {heroTxt &&
            documentToReactComponents(heroTxt, heroHeadingFormatOptions)}
        </h1>
        <span className="flex flex-col items-center justify-center md:w-2/3">
          <h2 className=" sub-heading-impact w-11/12 text-white">{subTxt}</h2>
          {/* <BookTasterPopUpForm
            isBookingOpen={isBookingOpen}
            setIsBookingOpen={setIsBookingOpen}
            venues={venues}
          /> */}
        </span>
      </span>

      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
      />

      <span className="pointer-events-none absolute inset-0 bg-black/50" />
    </section>
  );
}

HeroVideo.defaultProps = {
  heroTxt: undefined,
  subTxt: "",
  venues: [],
};

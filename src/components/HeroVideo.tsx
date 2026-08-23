import React from "react";

type Props = {
  videoUrl: string;
  heroTxt?: string;
  subTxt?: string;
};

// full-width video background with a dark overlay, used behind hero headings
export function HeroVideo({ videoUrl, heroTxt, subTxt }: Props) {
  return (
    <section className="relative -mt-20 flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden py-32 md:min-h-[85vh] md:py-48">
      <span className="relative z-10 flex flex-col items-center ">
        <h1 className="heading-impact text-center tracking-wide text-gold">
          {heroTxt}
        </h1>
        <span className="md:w-2/3">
          <h2 className="sub-heading-impact text-white">{subTxt}</h2>
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
      <span className="pointer-events-none absolute inset-0 bg-black/70" />
    </section>
  );
}

import React, { ReactNode } from "react";

type Props = {
  videoUrl: string;
  children: ReactNode;
};

// full-width video background with a dark overlay, used behind hero headings
export function HeroVideo({ videoUrl, children }: Props) {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden py-32 md:py-48">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
      />
      <span className="pointer-events-none absolute inset-0 bg-black/50" />
      {children}
    </section>
  );
}

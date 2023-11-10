import Image from "next/image";
import React from "react";

import mapImage from "@/public/map-background.png";

import VenueCard from "./VenueCard";

type Props = {
  venueData: { location: string }[];
};
export default function VenueCardContainer({ venueData }: Props) {
  return (
    <section className="flex h-screen w-full flex-col items-center bg-cover ">
      <VenueCard location={venueData[0].location} />
      <Image
        alt="styled map of surrey "
        //  style={{ objectFit: "contain" }}
        className="fixed left-0 top-10 -z-20 hidden h-screen object-none opacity-30 md:block"
        src={mapImage}
      />
    </section>
  );
}

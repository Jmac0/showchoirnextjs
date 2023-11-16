import Image from "next/image";
import React from "react";

import mapImage from "@/public/map-background.png";

import { VenueType } from "../types/types";
import VenueCard from "./VenueCard";

type Props = {
  venueData: VenueType[];
};
// component to hold venue cards
export default function VenueCardContainer({ venueData }: Props) {
  // sort by order property
  const sortedVenueData = [...venueData].sort((a, b) =>
    a.order < b.order ? -1 : 1
  );

  return (
    <section className="flex w-full flex-row flex-wrap items-center justify-center px-5">
      {/* render an array of venue cards */}
      {sortedVenueData.map((item) => (
        <VenueCard
          key={item.order}
          location={item.location}
          address={item.address}
          mapid={item.mapid}
          order={item.order}
        />
      ))}
      {/* background image of map of Surrey  */}
      <Image
        alt="styled map of surrey "
        //  style={{ objectFit: " contain" }}
        className="fixed left-0 top-10 -z-20 hidden h-screen w-full object-cover opacity-30 md:block"
        src={mapImage}
      />
    </section>
  );
}

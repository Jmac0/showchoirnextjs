import Image from "next/image";
import React from "react";

import mapImage from "@/public/map-background.png";

import { VenueType } from "../types/types";
import VenueCard from "./VenueCard";

type Props = {
  venueData: VenueType[];
  bodyTxt: string;
};
// component to hold venue cards
export default function VenueCardContainer({ venueData, bodyTxt }: Props) {
  // sort by order property
  const sortedVenueData = [...venueData].sort((a, b) =>
    a.order < b.order ? -1 : 1
  );
  return (
    <div className="flex flex-col">
      <h1 className="self-center">{bodyTxt}</h1>
      <section className="flex w-full flex-row flex-wrap items-center justify-center px-5">
        {/* render an array of venue cards */}
        {sortedVenueData.map((item) => (
          <VenueCard
            key={item.order}
            location={item.location}
            choirDayOfWeek={item.choirDayOfWeek}
            address={item.address}
            mapid={item.mapid}
            time={item.time}
            slug={item.slug}
            order={item.order}
            // TODO sort type ot to fix this
            photo={{
              fields: {
                title: "",
                file: {
                  url: "",
                },
              },
            }}
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
    </div>
  );
}

import Image from "next/image";
import React from "react";

import mapImage from "@/public/map-background.png";

import styles from "../styles/stage.module.css";
import { VenueType } from "../types/types";
import VenueCard from "./VenueCard";

type Props = {
  venueData: VenueType[];
  bodyTxt: React.ReactNode;
};
// component to hold venue cards
export default function VenueCardContainer({ venueData, bodyTxt }: Props) {
  // sort by order property
  const sortedVenueData = [...venueData].sort((a, b) =>
    a.order < b.order ? -1 : 1
  );
  return (
    <div className="flex flex-col">
      {bodyTxt && (
        <h2
          className={`${styles.display} mt-12 px-4 text-center text-3xl text-white md:text-4xl`}
        >
          {bodyTxt}
        </h2>
      )}
      <section className="mx-auto mt-8 grid w-full max-w-6xl gap-6 px-4 md:grid-cols-2 md:px-10 lg:grid-cols-3">
        {/* render an array of venue cards */}
        {sortedVenueData.map((item) => (
          <VenueCard
            key={item.order}
            location={item.location}
            choirDayOfWeek={item.choirDayOfWeek}
            address={item.address}
            googleMap={item.googleMap}
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
        {/* background image of map of Surrey - decoration, so no description
            for screen readers */}
        <Image
          alt=""
          //  style={{ objectFit: " contain" }}
          className="fixed left-0 top-10 -z-20 hidden h-screen w-full object-cover opacity-30 md:block"
          src={mapImage}
        />
      </section>
    </div>
  );
}

import React from "react";

import VenueCard from "./VenueCard";

export default function VenueCardContainer() {
  return (
    <section className="border-5 flex h-screen w-full bg-map-bg bg-cover p-5">
      <VenueCard />
    </section>
  );
}

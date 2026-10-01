import React from "react";

import { choirNames, ChoirVenue } from "@/src/lib/venues";

// The <option>s for a "Choose a choir" dropdown, built from the Contentful
// venues (see lib/venues.ts), so every form lists the same choirs:
//   <select {...register("homeChoir")}>
//     <ChoirOptions venues={venues} />
//   </select>
export function ChoirOptions({ venues }: { venues: ChoirVenue[] }) {
  return (
    <>
      <option value="">Choose a choir</option>
      {choirNames(venues).map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </>
  );
}

import React from "react";

type Props = {
  location: string;
};
// Displays the location  of the venue a small map, address, day time and a button to learn more
export default function VenueCard({ location }: Props) {
  return (
    <div className="flex w-11/12 flex-col bg-gray-500">
      <h1>{location}</h1>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Recusandae,
      quibusdam! Iure itaque quas officiis possimus rerum illo, ratione, officia
      minima, reprehenderit non recusandae est. Magnam repudiandae eligendi
      ducimus explicabo ab.
    </div>
  );
}

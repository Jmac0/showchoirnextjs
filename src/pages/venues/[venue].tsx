import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import {
  faInfoCircle,
  faSquareParking,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetStaticPropsContext } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";

import Logo from "@/src/components/Logo";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData, getVenueData } from "@/src/lib/contentfulClient";
import { formatOptions } from "@/src/lib/contentfulFormatOptions";
import { PathDataType, VenueType } from "@/src/types/types";

type Props = {
  currentPage?: VenueType;
  pathData?: { slug: string; displayText: string; order: number }[];
};
// displays a pre rendered page with details for a single venue
export default function Venue({ pathData, currentPage }: Props) {
  if (!currentPage) throw new Error("No page data available at build time");
  const { location, address, time, parking, googleMap, photo } = currentPage;
  const [venueAddress, setVenueAddress] = useState("");
  // destructure the photo object
  const {
    fields: {
      title,
      file: { url },
    },
  } = photo;

  useEffect(() => {
    // convert Contentful object to text
    const formattedAddress = documentToReactComponents(address, formatOptions);
    setVenueAddress(formattedAddress as string);
  }, [address]);
  return (
    <div className="m-0 flex flex-col overflow-hidden p-0">
      <Logo />
      <Nav pathData={pathData} />
      <main className="mt-16 flex w-full flex-col content-center items-center justify-center bg-transparent p-3 md:mt-20">
        <h1 className="mb-6">{location} Show Choir</h1>
        <section className="w-11/12 justify-evenly md:flex md:w-full md:flex-row  md:flex-wrap">
          {/* image choir venue */}
          <Image
            alt={title}
            src={`https:${url}`}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMiIhYCgAD5wG3R8/togAAAABJRU5ErkJggg=="
            priority
            width={500}
            height={500}
            sizes="100vw"
            className="mb-6 h-auto w-full rounded-md border-2 border-lightGold object-cover md:w-7/12"
          />
          {/* Venue and location info section */}
          <div className="mb-6 flex w-full flex-col rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-center text-gray-50 md:w-4/12">
            <FontAwesomeIcon
              className="self-start opacity-50"
              size="2xl"
              icon={faInfoCircle}
            />
            <h2 className="mb-0">Find us at</h2>
            <p className="mb-6">
              {time}
              {venueAddress}
            </p>

            <div className="flex flex-col">
              <FontAwesomeIcon
                className=" opacity-50"
                size="2xl"
                icon={faSquareParking}
              />
              <p className="mt-2">{parking}</p>
            </div>
          </div>
          {/* Google map */}
          <iframe
            title="map"
            src={`https://www.google.com/maps/d/u/0/embed?mid=${googleMap}`}
            width="640"
            height="480"
            className="h-96 w-full md:w-11/12" // optional
          />
        </section>
      </main>
    </div>
  );
}
Venue.defaultProps = {
  currentPage: {
    location: "",
    photo: {
      fields: {
        title: "",
        file: {
          url: "",
        },
      },
    },
  },
  pathData: [],
};
export async function getStaticPaths() {
  // url paths from Contentful for dynamic page generation
  const response = await getVenueData();
  const { items } = response;
  const paths = items.map((item: { fields: { slug: string } }) => ({
    params: { venue: item.fields.slug },
  }));
  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const venueResponse = await getVenueData();
  // extract relevant data for each venue to array of objects
  const venues = venueResponse.items.map((venue) => ({
    location: venue.fields.location,
    photo: venue.fields.photo || {},
    address: venue.fields.address,
    choirDayOfWeek: venue.fields.choirDayOfWeek,
    order: venue.fields.order,
    time: venue.fields.time,
    parking: venue.fields.parking,
    googleMap: venue.fields.googleMap,
    slug: venue.fields.slug,
  }));

  // Get data for main menu
  const res = await getPageData();
  const { items } = res;
  const pathData = items.map((item: PathDataType) => ({
    slug: item.fields.slug,
    displayText: item.fields.displayText,
    order: item.fields.order,
  }));
  const currentPage = venues.find((item) => item.slug === params?.venue);
  return {
    props: { venues, pathData, currentPage },
  };
}

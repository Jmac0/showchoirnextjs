import { BLOCKS } from "@contentful/rich-text-types";

import {
  ChoirHighlight,
  ChoirPhoto,
  ContentfulAssetType,
  VenueType,
} from "../types/types";
import { ChoirVenue } from "./venues";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contentful = require("contentful");

// How often (in seconds) a page built from Contentful is rebuilt in the
// background, so edits made in Contentful show on the site within the hour
// without a redeploy. Each rebuild costs a few Contentful API calls, and only
// happens when someone visits the page, so an hour keeps the number low
export const CONTENTFUL_REVALIDATE_SECONDS = 60 * 60;

export const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACEID as string,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN as string,
});

export const getHomePageData = () =>
  client
    .getEntry(process.env.CONTNETFUL_SYSTEM_ID)
    .then((res: unknown) => res)
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });

interface PageResponseType {
  items: [
    {
      fields: {
        slug: string;
        displayText: string;
        order: number;
        data: [];
      };
    }
  ];
}

interface VenueResponseType {
  items: [
    {
      sys?: { id: string };
      fields: VenueType;
    }
  ];
}

export async function getPageData() {
  let data: PageResponseType = {
    items: [
      {
        fields: { slug: "", displayText: "", data: [], order: 0 },
      },
    ],
  };
  await client
    .getEntries({
      content_type: "page",
      "sys.id[ne]": process.env.CONTNETFUL_SYSTEM_ID,
    })
    // eslint-disable-next-line no-return-assign
    .then((res: never) => (data = res))
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });
  return data;
}
export async function getVenueData() {
  let data: VenueResponseType = {
    items: [
      {
        fields: {
          location: "",
          data: [],
          photo: { fields: { title: "", file: { url: "" } } },
          order: 0,
          choirDayOfWeek: "",
          googleMap: "",
          address: { data: {}, content: [], nodeType: BLOCKS.DOCUMENT },
          time: "",
          parking: "",
          slug: "",
        },
      },
    ],
  };
  await client
    .getEntries({
      content_type: "venue",
      "sys.id[ne]": process.env.CONTNETFUL_SYSTEM_ID,
    })
    // eslint-disable-next-line no-return-assign
    .then((res: never) => (data = res))
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });
  return data;
}
// Just the choirs (town and order), for the "Choose a choir" dropdowns -
// used in getStaticProps by the sign-up pages - and the Book a taster API's
// check. See lib/venues.ts.
export async function getChoirVenues(): Promise<ChoirVenue[]> {
  const { items } = await getVenueData();
  return items.map(({ fields }) => ({
    location: fields.location,
    order: fields.order,
  }));
}

// A Contentful image -> what a page needs to show it, or null if it has no
// file (e.g. an image still being uploaded). The alt text is the image's
// Description in Contentful, or `fallbackAlt` if that's empty
export function toChoirPhoto(
  asset: ContentfulAssetType | undefined,
  fallbackAlt: string
): ChoirPhoto | null {
  const file = asset?.fields?.file;
  if (!file?.url) return null;
  return {
    url: `https:${file.url}`,
    alt: asset?.fields?.description?.trim() || fallbackAlt,
    // sizes are always there for images; these only guard odd uploads
    width: file.details?.image?.width ?? 1200,
    height: file.details?.image?.height ?? 900,
  };
}

// The most recent performances and news for one choir: "Choir highlight"
// entries in Contentful that point at its venue, newest first. A choir with
// none gets an empty list (and its page leaves the section out). If
// Contentful fails - or the content type hasn't been created yet - the page
// still builds, just without highlights
export async function getChoirHighlights(
  venueId: string,
  limit = 6
): Promise<ChoirHighlight[]> {
  try {
    const res = await client.getEntries({
      content_type: "choirHighlight",
      "fields.venue.sys.id": venueId,
      order: "-fields.date",
      limit,
    });
    return res.items.map(
      (item: {
        sys: { id: string };
        fields: {
          title?: string;
          date?: string;
          text?: string;
          photos?: ContentfulAssetType[];
        };
      }) => ({
        id: item.sys.id,
        title: item.fields.title ?? "",
        date: item.fields.date ?? null,
        text: item.fields.text ?? null,
        photos: (item.fields.photos ?? [])
          .map((photo) => toChoirPhoto(photo, item.fields.title ?? ""))
          .filter((photo): photo is ChoirPhoto => photo !== null),
      })
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Choir highlights not loaded:", (err as Error).message);
    return [];
  }
}

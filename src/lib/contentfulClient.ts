import { BLOCKS } from "@contentful/rich-text-types";

import { VenueType } from "../types/types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contentful = require("contentful");

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
          mapid: "",
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
export async function getNotificationData() {
  let data = {
    items: [
      {
        fields: {
          title: "",
          details: [],
          date: "",
          location: "",
          pinned: false,
        },
      },
    ],
  };
  await client
    .getEntries({
      content_type: "notifications",
      "sys.id[ne]": process.env.CONTNETFUL_SYSTEM_ID,
    })
    // eslint-disable-next-line no-return-assign
    .then((res: never) => (data = res))
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const contentful = require("contentful");

export const client = contentful.createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACEID as string,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACESS_TOKEN as string,
});

export const getHomePageData = () =>
  client
    .getEntry(process.env.NEXT_PUBLIC_CONTNETFUL_SYSTEM_ID)
    .then((res: unknown) => res)
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });

interface Response {
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

export async function getPageData() {
  let data: Response = {
    items: [
      {
        fields: { slug: "", displayText: "", data: [], order: 0 },
      },
    ],
  };
  await client
    .getEntries({
      content_type: "page",
      "sys.id[ne]": process.env.NEXT_PUBLIC_CONTNETFUL_SYSTEM_ID,
    })
    // eslint-disable-next-line no-return-assign
    .then((res: never) => (data = res))
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });
  return data;
}

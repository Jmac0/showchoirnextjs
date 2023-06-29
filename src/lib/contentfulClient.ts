// eslint-disable-next-line @typescript-eslint/no-var-requires
const contentful = require("contentful");

export const client = contentful.createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACEID as string,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACESS_TOKEN as string,
});

export const getHomePageData = () =>
  client
    .getEntry(process.env.NEXT_PUBLIC_CONTNETFUL_SYSTEM_ID)
    .then((res: any) => res)
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });
export const getPageData = () => {
  client
    .getEntries({
      content_type: "page",
      "sys.id[ne]": `${process.env.NEXT_PUBLIC_CONTNETFUL_SYSTEM_ID}`,
    })
    .then((res: any) => res)
    .catch((err: { message: string }) => {
      throw new Error(err.message);
    });
};

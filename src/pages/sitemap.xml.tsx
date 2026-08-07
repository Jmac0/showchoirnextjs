import { GetServerSideProps } from "next";

import { getPageData, getVenueData } from "@/src/lib/contentfulClient";

const BASE_URL = "https://show-choir.co.uk";

function generateSitemap(slugs: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
  </url>
  ${slugs
    .map(
      (slug) => `<url>
    <loc>${BASE_URL}/${slug}</loc>
  </url>`,
    )
    .join("\n  ")}
</urlset>`;
}

// this page has no UI of its own - getServerSideProps writes the XML
// response directly and the component is never rendered
export default function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const pageResponse = await getPageData();
  const venueResponse = await getVenueData();

  const pageSlugs = pageResponse.items.map((item) => item.fields.slug);
  const venueSlugs = venueResponse.items.map(
    (venue) => `venues/${venue.fields.slug}`,
  );

  const sitemap = generateSitemap([...pageSlugs, ...venueSlugs]);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

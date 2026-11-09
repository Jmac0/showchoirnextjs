import Head from "next/head";

import { SITE_URL } from "@/src/lib/structuredData";

type Props = {
  title: string;
  description: string;
  // the page's address on the site, e.g. "/" or "/venues/choir-dorking-surrey"
  path: string;
  // the picture shown when the link is shared: a full address (e.g. from
  // Contentful) or a file in /public such as "/oklahoma.jpg"
  image?: string;
};

// A public page's title, description and "canonical" address (the one true
// address of the page - always the live www site, so copies such as the dev
// site at app.show-choir.co.uk don't compete with it in search), plus what
// Facebook, WhatsApp and others show when the link is shared
export function PageMeta({ title, description, path, image }: Props) {
  const url = `${SITE_URL}${path}`;
  const picture = image ?? "/oklahoma.jpg";
  const imageUrl = picture.startsWith("/") ? `${SITE_URL}${picture}` : picture;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Show Choir Surrey" />
      <meta property="og:locale" content="en_GB" />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
}
PageMeta.defaultProps = {
  image: "/oklahoma.jpg",
};

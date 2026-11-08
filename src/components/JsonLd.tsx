// Structured data (lib/structuredData.ts) as a <script> tag, to go straight
// inside next/head's <Head> - Head only picks up plain tags, not components,
// hence a function. The key stops Head merging two of them on one page.
// "<" is escaped so text from Contentful can never close the script early.
export function jsonLdScript(data: object, key = "jsonld") {
  return (
    <script
      key={key}
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

// Contentful leaves an optional field out when it's empty (e.g. a choir with
// no Parking or Google Map), so it arrives as undefined - and Next.js refuses
// to send undefined from getStaticProps: the page fails to build. On a
// deploy that's a failed build; on the hourly rebuild it fails quietly and
// the site keeps showing old content. Wrapping getStaticProps' props in this
// drops every undefined value, at any depth, so an emptied field just means
// "not there" - which the pages already handle (e.g. `parking && ...`).
export function withoutUndefined<T>(props: T): T {
  return JSON.parse(JSON.stringify(props));
}

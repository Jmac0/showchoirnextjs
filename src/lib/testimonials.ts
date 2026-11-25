// Members' quotes for a choir's page, from the venue's "testimonials" field
// in Contentful: one per line, the quote then a dash and the first name, e.g.
//   I was so nervous, but everyone was lovely! - Sue
// Quote marks are optional (they're added on the page). A line with no name
// is shown without one. Browser-safe.

export type Testimonial = { quote: string; name: string | null };

export function parseTestimonials(text?: string | null): Testimonial[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // the last dash with spaces round it (-, – or —) comes before the name
      const match = line.match(/^(.*\S)\s+[-–—]\s+([^-–—]+)$/);
      const quote = (match ? match[1] : line)
        .replace(/^["“'‘]+|["”'’]+$/g, "")
        .trim();
      return { quote, name: match ? match[2].trim() : null };
    })
    .filter((testimonial) => testimonial.quote);
}

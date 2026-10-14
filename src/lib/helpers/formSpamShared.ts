// Anti-spam rules shared by the public forms (Contact, Book a taster) and
// their API routes - browser-safe, so the forms can warn people straight away
// and the server can enforce the same rules.

// Spam almost always carries links; a real enquiry rarely needs one.
// Catches "http(s)://", "www." and the HTML / forum link formats bots use.
export const LINK_PATTERN = /(https?:\/\/|www\.|\[url|<a\s)/i;

export const LINK_MESSAGE =
  "Please remove any links (web addresses) and try again";

// Longest message the contact form accepts
export const MAX_MESSAGE_LENGTH = 3000;

// Longest name accepted (first or last)
export const MAX_NAME_LENGTH = 50;

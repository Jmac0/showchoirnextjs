// Rules for the choir leader application form - browser-safe, so the form
// can warn applicants straight away and the API can enforce the same rules
// (a bot can skip the form and post straight to the API).

export const MAX_FULL_NAME_LENGTH = 100;
export const MAX_TOWN_LENGTH = 60;

// Experience is the main part of the application: long enough to say
// something real, which also stops bots that send a word or two
export const MIN_EXPERIENCE_LENGTH = 50;
export const MAX_EXPERIENCE_LENGTH = 4000;

// The shorter answers: what excites them about the job, and their questions
export const MAX_ANSWER_LENGTH = 2000;

// UK phone numbers: 0 or +44 followed by 9-10 digits. Spaces, brackets and
// dashes are allowed as people type them.
export const isUkPhone = (value: string) =>
  /^(?:\+44|0044|0)\d{9,10}$/.test(value.replace(/[\s()-]/g, ""));

// The first part of a UK postcode (e.g. "KT12"), or a full postcode
// (e.g. "KT12 1AB"). We only ask for the first part - it's enough to see how
// far someone lives from our choirs, without their full address.
export const isPostcodeArea = (value: string) =>
  /^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i.test(value.trim());

// Just the first part, in capitals, whichever form was typed
export const postcodeArea = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s*\d[A-Z]{2}$/, "");

// Simple shape check (something@something.something). The form's yup check
// is stricter; this is the server's backstop.
export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

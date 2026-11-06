// A member's yes or no to having their email shared with Meta, to find people
// like them for our ads and not show them those ads. Separate from the cookie
// banner (lib/cookieConsent.ts), which covers this browser only, and from the
// required "I agree" on the sign-up form, which can't double as this.

// Change this whenever the wording in components/forms/MetaAudienceOptIn.tsx
// changes, so each member's record shows what they were agreeing to
export const META_AUDIENCE_WORDING_VERSION = "2026-11";

export type MetaAudienceChoice = {
  opted_in: boolean;
  at: Date;
  wording: string;
};

// Only a real tick counts as a yes: anything else is saved as a no
export const metaAudienceChoice = (optedIn: unknown): MetaAudienceChoice => ({
  opted_in: optedIn === true,
  at: new Date(),
  wording: META_AUDIENCE_WORDING_VERSION,
});

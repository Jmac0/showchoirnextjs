// Where members download the Show Choir app (showChoirExpoApp). Used by the
// member menu (components/GooglePlayBadge.tsx) and the welcome email.
export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=co.uk.showchoir.app&hl=en_GB";

// Google's own "Get it on Google Play" badge - their rules say to use it
// as is, not a home-made icon. The website uses a copy in /public; emails use
// Google's, as email images must already be online (a new file in /public
// only is once it reaches the live site).
export const GOOGLE_PLAY_BADGE_EMAIL =
  "https://play.google.com/intl/en_gb/badges/static/images/badges/en_badge_web_generic.png";

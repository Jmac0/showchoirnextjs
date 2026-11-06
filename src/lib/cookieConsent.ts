import { useSyncExternalStore } from "react";

// The visitor's answer to the cookie banner (components/CookieBanner.tsx). The
// law asks for a yes before advertising cookies are set, so nothing from Meta
// runs until this says "accepted". The login cookie is essential, so it isn't
// part of this. Runs in the browser, so no server-only code here.

export type CookieChoice = "accepted" | "rejected";

const CHOICE_COOKIE = "show_choir_cookie_choice";
const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 182;
const CHOICE_CHANGED = "show-choir-cookie-choice-changed";
const OPEN_SETTINGS = "show-choir-open-cookie-settings";

// Never tracked: private pages, and links that carry someone's encrypted email
// or a reset token in the address - the pixel sends Meta the page address.
// /direct-debit-thanks is where the app sends members, and the app promises
// not to track them.
const UNTRACKED_PATHS = [
  "/members",
  "/account",
  "/auth",
  "/register",
  "/direct-debit-thanks",
];

export function isUntrackedPath(path: string) {
  const pathname = path.split(/[?#]/)[0];
  return UNTRACKED_PATHS.some(
    (untracked) =>
      pathname === untracked || pathname.startsWith(`${untracked}/`)
  );
}

function readCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return cookie?.slice(name.length + 1);
}

export function getCookieChoice(): CookieChoice | null {
  const value = readCookie(CHOICE_COOKIE);
  return value === "accepted" || value === "rejected" ? value : null;
}

// Meta sets its cookies on the main domain (.show-choir.co.uk), so clear them
// for this address and each domain above it
function deleteMetaCookies() {
  const parts = window.location.hostname.split(".");
  const domains = parts.map((_, index) => parts.slice(index).join("."));
  ["_fbp", "_fbc"].forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    domains.forEach((domain) => {
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}`;
    });
  });
}

export function saveCookieChoice(choice: CookieChoice) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CHOICE_COOKIE}=${choice}; Max-Age=${SIX_MONTHS_IN_SECONDS}; Path=/; SameSite=Lax${secure}`;
  if (choice === "rejected") deleteMetaCookies();
  window.dispatchEvent(new Event(CHOICE_CHANGED));
}

// The footer's "Cookie settings" link asks the banner to show again
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS));
}

export function onOpenCookieSettings(callback: () => void) {
  window.addEventListener(OPEN_SETTINGS, callback);
  return () => window.removeEventListener(OPEN_SETTINGS, callback);
}

function subscribeToChoice(callback: () => void) {
  window.addEventListener(CHOICE_CHANGED, callback);
  return () => window.removeEventListener(CHOICE_CHANGED, callback);
}

// null = not answered yet. undefined = not known yet, because pages are built
// on the server, which can't see cookies - so nobody who has already answered
// sees the banner flash up while the page loads.
export function useCookieChoice(): CookieChoice | null | undefined {
  return useSyncExternalStore(
    subscribeToChoice,
    getCookieChoice,
    () => undefined
  );
}

// Added to what a form sends, so the server can tell Meta about a booking or a
// sign-up. Empty unless the visitor said yes, so without consent the server
// has nothing to send. Just the page's address: its query could hold anything.
export function adTrackingFields() {
  if (
    getCookieChoice() !== "accepted" ||
    isUntrackedPath(window.location.pathname)
  ) {
    return {};
  }
  return {
    metaConsent: true,
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    sourceUrl: `${window.location.origin}${window.location.pathname}`,
  };
}

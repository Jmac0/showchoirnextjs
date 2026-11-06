import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import {
  CookieChoice,
  isUntrackedPath,
  onOpenCookieSettings,
  saveCookieChoice,
  useCookieChoice,
} from "@/src/lib/cookieConsent";

const BUTTON =
  "rounded-md border-2 border-lightGold px-5 py-2 font-bold text-lightGold hover:bg-lightGold hover:text-black";

// Asks visitors whether Meta's advertising cookies may be used. Accept and
// Reject deliberately look the same: the ICO expects saying no to be as easy as
// saying yes. Doesn't ask on private pages, where Meta never runs anyway -
// unless someone opens it from the footer's "Cookie settings" link.
export function CookieBanner() {
  const { asPath } = useRouter();
  const choice = useCookieChoice();
  const [reopened, setReopened] = useState(false);

  useEffect(() => onOpenCookieSettings(() => setReopened(true)), []);

  const firstVisit = choice === null && !isUntrackedPath(asPath);
  if (!firstVisit && !reopened) return null;

  const choose = (newChoice: CookieChoice) => {
    saveCookieChoice(newChoice);
    setReopened(false);
    // Meta's code can't be unloaded from a page that's already open, so
    // reloading is what actually stops it after a change of mind
    if (choice === "accepted" && newChoice === "rejected") {
      window.location.reload();
    }
  };

  return (
    // z-40: above the menu (Nav z-30) and the phone booking bar (z-20)
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-40 p-3"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border-2 border-lightGold bg-lightBlack p-4 text-sm text-gray-200 md:flex-row md:items-center">
        <p className="m-0 flex-1 p-0 text-left">
          Can we use Meta (Facebook) advertising cookies? They help us see which
          ads work and reach more people who&apos;d love to sing with us. Say no
          and the site works just the same. See our{" "}
          <Link className="underline" href="/privacy-policy#cookies">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 justify-center gap-3">
          <button
            type="button"
            className={BUTTON}
            onClick={() => choose("accepted")}
          >
            Accept
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => choose("rejected")}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

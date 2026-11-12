import React, { useEffect, useState } from "react";

import { GooglePlayBadge } from "@/src/components/GooglePlayBadge";

// Remembered in this browser once they press "Got it!", like the app's
// "Show this code at rehearsal" hint (qrSignInHintDismissed)
const DISMISSED_KEY = "appDownloadMessageDismissed";

// The first thing members see on Announcements after logging in: get the
// app. Gone for good (in this browser) once dismissed.
export function AppDownloadMessage() {
  // Hidden until the browser has been checked, so it doesn't flash up for
  // someone who has already dismissed it
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISSED_KEY)) setShow(true);
    } catch {
      // Storage blocked (e.g. private browsing) - show it; it just won't be
      // remembered
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // nothing to do - hidden for this visit anyway
    }
  };

  if (!show) return null;

  return (
    <section
      aria-label="Get the Show Choir app"
      className="mb-8 flex w-full max-w-4xl flex-col items-center gap-3 rounded-xl border-2 border-lightGold bg-gradient-to-br from-lightBlack to-black p-5 text-center shadow-lg shadow-lightGold/10 md:w-11/12"
    >
      <h2 className="p-0 text-lightGold">Welcome!</h2>
      <p className="max-w-xl text-gray-100">
        Next step: download the Show Choir app to check in at choir, read
        messages and get all the learning resources on the go!
      </p>
      <GooglePlayBadge className="w-fit" />
      <button
        type="button"
        onClick={dismiss}
        className="mt-1 flex items-center gap-2 rounded-full border border-lightGold px-4 py-1 text-sm text-lightGold transition-colors hover:bg-lightGold hover:text-black"
      >
        Got it! <span aria-hidden>✕</span>
      </button>
    </section>
  );
}

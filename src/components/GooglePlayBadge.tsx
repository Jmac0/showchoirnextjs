import Image from "next/image";
import React from "react";

import badge from "@/public/google-play-badge.png";
import { GOOGLE_PLAY_URL } from "@/src/lib/appLinks";

// "Get it on Google Play" - links to the Show Choir app in the Play Store
// (opens in a new tab). Google's badge image has its own clear space
// around it, so no extra padding is needed.
export function GooglePlayBadge({ className }: { className: string }) {
  return (
    <a
      href={GOOGLE_PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`block transition-transform hover:scale-105 ${className}`}
    >
      <Image
        src={badge}
        alt="Get the Show Choir app on Google Play"
        width={160}
        className="h-auto"
      />
    </a>
  );
}

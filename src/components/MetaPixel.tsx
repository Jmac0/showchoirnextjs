import { useRouter } from "next/router";
import Script from "next/script";
import { useEffect, useState } from "react";

import { isUntrackedPath, useCookieChoice } from "@/src/lib/cookieConsent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Meta's standard loader, with autoConfig off so it can't read buttons and
// form fields.
const pixelCode = (id: string) => `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${id}');
fbq('init','${id}');
fbq('track','PageView');
`;

// Tells Meta about page visits, only after the visitor accepts cookies and
// never on private pages. Bookings and joins are sent by the server instead
// (lib/metaConversions.ts). Does nothing until NEXT_PUBLIC_META_PIXEL_ID is set.
export function MetaPixel() {
  const { asPath, events } = useRouter();
  const choice = useCookieChoice();
  const path = asPath.split(/[?#]/)[0];
  const allowed =
    Boolean(PIXEL_ID) && choice === "accepted" && !isUntrackedPath(path);

  const [started, setStarted] = useState(false);

  // Meta's code counts page changes by itself and reports them straight away,
  // so it has to be paused before the move to a private page, not after
  useEffect(() => {
    if (!started) return undefined;
    const beforePageChange = (url: string) => {
      if (isUntrackedPath(url)) window.fbq?.("consent", "revoke");
    };
    events.on("routeChangeStart", beforePageChange);
    return () => events.off("routeChangeStart", beforePageChange);
  }, [started, events]);

  // Starting it sends this page's PageView (pixelCode above). Coming back from
  // a private page resumes it, counting from the next page on.
  useEffect(() => {
    if (!allowed) return;
    if (started) window.fbq?.("consent", "grant");
    else setStarted(true);
  }, [allowed, started, path]);

  if (!started || !PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {pixelCode(PIXEL_ID)}
    </Script>
  );
}

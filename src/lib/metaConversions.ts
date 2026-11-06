import { createHash, randomUUID } from "crypto";
import type { NextApiRequest } from "next";

import { clientIp } from "@/src/lib/helpers/formSpamCheck";

// Tells Meta about taster bookings and new members from our server (Meta calls
// this the Conversions API), so ads can be aimed at people like them. Only for
// visitors who accepted cookies: their browser says so when it sends a form
// (adTrackingFields in lib/cookieConsent.ts). Server only - META_CAPI_TOKEN is
// secret. Does nothing until META_CAPI_TOKEN and NEXT_PUBLIC_META_PIXEL_ID are
// set; never throws, because a booking or payment matters more than an ad.

// Meta retires versions over time. If its error (logged below) says this one
// has gone, update it to the latest: developers.facebook.com/docs/graph-api
const API_VERSION = "v26.0";
const TIMEOUT_MS = 3000;
// More than any real value, so nobody can store huge text through a form
const MAX_LENGTH = 500;

export type MetaAttribution = {
  fbp?: string;
  fbc?: string;
  ip?: string;
  user_agent?: string;
  source_url?: string;
  consented_at: Date;
};

const shortString = (value: unknown) =>
  typeof value === "string" && value && value.length <= MAX_LENGTH
    ? value
    : undefined;

// Just the site and page: a query could hold anything
function pageAddress(value: unknown) {
  const address = shortString(value);
  if (!address) return undefined;
  try {
    const { protocol, origin, pathname } = new URL(address);
    return /^https?:$/.test(protocol) ? `${origin}${pathname}` : undefined;
  } catch {
    return undefined;
  }
}

// What a consenting visitor's form sent, plus their internet address and
// browser, which help Meta match them. Nothing unless they said yes.
export function attributionFromRequest(
  req: NextApiRequest
): MetaAttribution | undefined {
  const { metaConsent, fbp, fbc, sourceUrl } = req.body ?? {};
  if (metaConsent !== true) return undefined;
  const ip = clientIp(req);
  return {
    fbp: shortString(fbp),
    fbc: shortString(fbc),
    ip: ip === "unknown" ? undefined : ip,
    user_agent: req.headers["user-agent"]?.slice(0, MAX_LENGTH),
    source_url: pageAddress(sourceUrl),
    consented_at: new Date(),
  };
}

// Meta asks for emails tidied up and scrambled (hashed) before they're sent
const hashEmail = (email: string) =>
  createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

type MetaEvent = {
  eventName: "Lead" | "Purchase" | "Subscribe";
  email: string;
  attribution: MetaAttribution;
  // Meta ignores a repeat of the same id, e.g. if a webhook is sent twice
  eventId?: string;
  valuePounds?: number;
};

export async function sendMetaEvent({
  eventName,
  email,
  attribution,
  eventId = randomUUID(),
  valuePounds,
}: MetaEvent) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Don't keep a webhook or booking waiting on Meta
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          access_token: token,
          // Only set on previews, so tests show in Meta's "Test events" tab
          ...(process.env.META_TEST_EVENT_CODE && {
            test_event_code: process.env.META_TEST_EVENT_CODE,
          }),
          data: [
            {
              event_name: eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              action_source: "website",
              event_source_url: attribution.source_url,
              user_data: {
                em: [hashEmail(email)],
                fbp: attribution.fbp,
                fbc: attribution.fbc,
                client_ip_address: attribution.ip,
                client_user_agent: attribution.user_agent,
              },
              ...(valuePounds !== undefined && {
                custom_data: { currency: "GBP", value: valuePounds },
              }),
            },
          ],
        }),
      }
    );
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(
        `💥 Meta ${eventName} event failed:`,
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `💥 Meta ${eventName} event failed:`,
      (error as Error).message
    );
  }
}

/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from "next";

import { LINK_MESSAGE, LINK_PATTERN } from "./formSpamShared";

// Server-side spam checks for the public forms (Contact, Book a taster).
// The forms post to our API with an ordinary request, so a bot can skip the
// page and post straight to the API - a hidden field alone only catches bots
// that fill in the visible form. These checks run on the server, where a bot
// can't avoid them.

// Nobody can fill in a form faster than this; bots submit instantly
export const MIN_FILL_TIME_MS = 2000;

// Most sends allowed from one internet address per form, per hour
export const MAX_SENDS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

// Recent send times per form + address. Kept in memory because the live site
// has no database yet: each Vercel server instance keeps its own count, so
// this slows a burst from one bot rather than being an exact limit. Move it
// to Mongo (like lib/loginLimiter.ts on dev) once the live database exists.
const recentSends = new Map<string, number[]>();

// The visitor's internet address - Vercel puts it first in x-forwarded-for
function clientIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    .trim();
  return first || req.socket?.remoteAddress || "unknown";
}

// Records this send and says whether the address is over the limit
function tooManySends(key: string, now: number) {
  const times = (recentSends.get(key) ?? []).filter(
    (time) => now - time < HOUR_MS
  );
  times.push(now);
  recentSends.set(key, times);
  // Stop the list growing without end if lots of addresses send once
  if (recentSends.size > 5000) recentSends.clear();
  return times.length > MAX_SENDS_PER_HOUR;
}

// For tests: start each test with no sends counted
export function resetSpamCounts() {
  recentSends.clear();
}

type SpamCheckArgs = {
  req: NextApiRequest;
  res: NextApiResponse;
  // Which form, for the per-address count and the log
  form: "contact" | "taster";
  // Visitor-typed text to check for links (names, message)
  texts: unknown[];
  // What a real send replies, so a bot gets the same answer and learns nothing
  successMessage: string;
};

// Returns true if it has already replied (spam or too many sends), like
// validateFormData - the caller then stops.
export function rejectSpam({
  req,
  res,
  form,
  texts,
  successMessage,
}: SpamCheckArgs) {
  const { company, elapsed_ms: elapsedMs } = req.body ?? {};

  // 1. Honeypot: a hidden field people never see, so never fill in
  // 2. Too quick, or no fill time at all (posted straight to the API)
  // Both pretend to succeed, so the bot doesn't know to try something else.
  const elapsed = Number(elapsedMs);
  let reason = null;
  if (company) {
    reason = "hidden field filled in";
  } else if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_TIME_MS) {
    reason = "sent too quickly or not from the form";
  }
  if (reason) {
    console.log(`Spam blocked (${form} form): ${reason}`);
    res.status(200).json({ message: successMessage });
    return true;
  }

  // 3. Links - a real person may have pasted one, so tell them
  if (
    texts.some((text) => typeof text === "string" && LINK_PATTERN.test(text))
  ) {
    console.log(`Spam blocked (${form} form): contains a link`);
    res.status(400).json({ message: LINK_MESSAGE });
    return true;
  }

  // 4. Too many sends from one address
  if (tooManySends(`${form}:${clientIp(req)}`, Date.now())) {
    console.log(`Spam blocked (${form} form): too many sends`);
    res.status(429).json({
      message:
        "You've sent a lot of messages - please try again later or give us a call",
    });
    return true;
  }

  return false;
}

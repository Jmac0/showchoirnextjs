import type { IncomingHttpHeaders } from "node:http";

import LoginAttempts from "@/src/lib/models/loginAttempt";

/* Stops passwords being guessed by trying again and again - used by both
logins: the website (pages/api/auth/[...nextauth].ts) and the app
(api/auth/appLogin.ts). Counted in the database, as each Vercel function
has its own memory.

  Per email:      MAX_PER_EMAIL wrong passwords in WINDOW_MINUTES, then that
                  email can't log in until the window ends (someone guessing
                  one member's password)
  Per IP address: MAX_PER_IP failures in WINDOW_MINUTES (someone trying lots
                  of different emails from one machine)

A successful login clears the email's count. The caller must have
connected to the database. */

export const WINDOW_MINUTES = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 30;

export const TOO_MANY_ATTEMPTS = `Too many attempts - please wait ${WINDOW_MINUTES} minutes and try again`;

// The visitor's IP address (Vercel puts the real one first in
// x-forwarded-for)
export const ipFrom = (
  headers: IncomingHttpHeaders | Record<string, unknown> = {}
) =>
  String(headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown")
    .split(",")[0]
    .trim();

const keysFor = (email: string, ip: string) => ({
  email: `email:${email}`,
  ip: `ip:${ip}`,
});

// True if this email, or this IP address, has had too many failures
export async function isLoginBlocked(email: string, ip: string) {
  const keys = keysFor(email, ip);
  const blocked = await LoginAttempts.exists({
    expires_at: { $gt: new Date() },
    $or: [
      { key: keys.email, failures: { $gte: MAX_PER_EMAIL } },
      { key: keys.ip, failures: { $gte: MAX_PER_IP } },
    ],
  });
  return !!blocked;
}

// Counts a wrong password (or unknown email) against both
export async function recordLoginFailure(email: string, ip: string) {
  const keys = keysFor(email, ip);
  const expiresAt = new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);
  await Promise.all(
    [keys.email, keys.ip].map((key) =>
      LoginAttempts.updateOne(
        { key },
        { $inc: { failures: 1 }, $setOnInsert: { expires_at: expiresAt } },
        { upsert: true }
      )
    )
  );
}

// They got in - forget the email's failures (the IP's count stays, so
// one right password can't reset guessing at other accounts)
export async function clearLoginFailures(email: string) {
  await LoginAttempts.deleteOne({ key: `email:${email}` });
}

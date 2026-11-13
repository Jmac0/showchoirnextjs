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

// --- Password checks once logged in (change password, delete account) ---
// Counted per member, separately from the login form - otherwise anyone who
// knew a member's email could keep them from changing their password by
// making wrong logins. Same limit and window. Each try is counted before the
// password is checked (one atomic step), so many tries sent at once can't
// all slip in before any is counted; a right password takes its try back.

const passwordCheckKey = (memberId: string) => `password-check:${memberId}`;

// Counts a try; true if it's over the limit (don't check the password)
export async function startPasswordCheck(memberId: string) {
  const attempts = await LoginAttempts.findOneAndUpdate(
    { key: passwordCheckKey(memberId) },
    {
      $inc: { failures: 1 },
      $setOnInsert: {
        expires_at: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
      },
    },
    { upsert: true, new: true }
  );
  return (attempts?.failures ?? 0) > MAX_PER_EMAIL;
}

// The password was right - that try doesn't count
export async function passwordCheckPassed(memberId: string) {
  await LoginAttempts.updateOne(
    { key: passwordCheckKey(memberId), failures: { $gt: 0 } },
    { $inc: { failures: -1 } }
  );
}

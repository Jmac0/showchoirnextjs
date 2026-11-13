import type { IncomingMessage } from "node:http";

// Where to send someone with no website login. If their browser still sent
// a login cookie, the login has just been ended (e.g. their password was
// changed on another device - pages/api/auth/[...nextauth].ts), so the
// sign-in page says so rather than looking like something broke.
export function signInDestination(
  req: IncomingMessage & { cookies?: Partial<Record<string, string>> }
) {
  const names = Object.keys(req.cookies || {});
  const hadLogin = names.some(
    (name) =>
      name.startsWith("next-auth.session-token") ||
      name.startsWith("__Secure-next-auth.session-token")
  );
  return hadLogin ? "/auth/signin?ended=1" : "/auth/signin";
}

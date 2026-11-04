import { NextApiRequest, NextApiResponse } from "next";

// Allows the Expo app's web target (and any other cross-origin client) to call
// these JWT-authenticated "app" API routes. Auth here is a Bearer token, not a
// cookie, so a wildcard origin doesn't expose these routes to CSRF. (The
// announcements admin routes also take the website login, but its cookie is
// SameSite=Lax, so other sites can't send it, and "*" never allows them to
// read a cookie-authenticated reply.)
export function applyCors(req: NextApiRequest, res: NextApiResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

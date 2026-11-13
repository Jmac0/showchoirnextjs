import crypto from "crypto";
import jwt from "jsonwebtoken";

import { HeadersType } from "@/src/types/types";

const jwtSecret = process.env.JWT_SECRET as string;

// The app's two kinds of login token (api/auth/appLogin.ts):
//   access  - sent with every request, lasts ~15 minutes
//   refresh - lasts 30 days, only ever swapped for a new access token
//             (api/auth/refresh.ts) and checked against the member's list,
//             so logging out or changing password ends it
// Each says which it is ("typ"), so a refresh token can't be used as an
// access token - otherwise a copied one would keep working for 30 days
// after logout. Tokens made before "typ" existed: refresh tokens still
// refresh (they're in the member's list), old access tokens are turned
// down and the app quietly gets a new one.
type TokenKind = "access" | "refresh";
type TokenPayload = { id: string; typ?: TokenKind };

const ACCESS_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || "30d";

const signAccessToken = (id: string) =>
  jwt.sign({ id, typ: "access" }, jwtSecret, {
    expiresIn: ACCESS_EXPIRY,
  } as jwt.SignOptions);

// jwtid: a random id, so every login gets a different refresh token -
// otherwise two phones logging in within the same second would get the
// same one, and couldn't be logged out separately (e.g. by a password
// change, which keeps only the phone it was changed from)
const signRefreshToken = (id: string) =>
  jwt.sign({ id, typ: "refresh" }, jwtSecret, {
    jwtid: crypto.randomUUID(),
    expiresIn: REFRESH_EXPIRY,
  } as jwt.SignOptions);

const verify = (token: unknown): TokenPayload | null => {
  // Only strings - request values reach database queries
  if (typeof token !== "string" || !token) return null;
  try {
    return jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    }) as TokenPayload;
  } catch {
    return null;
  }
};

// A refresh token's payload, or null if it's expired, tampered with or an
// access token (it must still be checked against the member's list)
const verifyRefreshToken = (token: unknown) => {
  const payload = verify(token);
  return payload && payload.typ !== "access" ? payload : null;
};

// Get only the JWT token from the "Bearer <token>" auth header, if present
const extractToken = (requestHeaders: HeadersType["headers"]) => {
  const tokenString = requestHeaders.authorization;
  if (!tokenString || !tokenString.startsWith("Bearer ")) return null;
  return tokenString.split(" ")[1] || null;
};

// The access token in the request's "Bearer" header, checked: its payload
// ({ id }), or null if missing, invalid, expired or not an access token
const getJWTPayload = (requestHeaders: HeadersType["headers"]) => {
  const payload = verify(extractToken(requestHeaders));
  return payload?.typ === "access" ? { id: payload.id } : null;
};

// Whether the request has a valid access token
const verifyJWT = (requestHeaders: HeadersType["headers"]) =>
  !!getJWTPayload(requestHeaders);

export {
  getJWTPayload,
  signAccessToken,
  signRefreshToken,
  verifyJWT,
  verifyRefreshToken,
};

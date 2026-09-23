import jwt from "jsonwebtoken";

import { HeadersType } from "@/src/types/types";

const jwtSecret = process.env.JWT_SECRET as string;

// Get only the JWT token from the "Bearer <token>" auth header, if present
const extractToken = (requestHeaders: HeadersType["headers"]) => {
  const tokenString = requestHeaders.authorization;
  if (!tokenString || !tokenString.startsWith("Bearer ")) return null;
  return tokenString.split(" ")[1] || null;
};

// function to verify JWT token
const verifyJWT = (requestHeaders: HeadersType["headers"]) => {
  const token = extractToken(requestHeaders);
  if (!token) return false;

  try {
    // jwt.verify will throw an error if the token is invalid
    jwt.verify(token, jwtSecret);
  } catch (err) {
    if (err) return false;
  }
  return true;
};

// verifies the JWT token and returns its decoded payload (e.g. { id }), or null if invalid
const getJWTPayload = (requestHeaders: HeadersType["headers"]) => {
  const token = extractToken(requestHeaders);
  if (!token) return null;

  try {
    return jwt.verify(token, jwtSecret) as { id: string };
  } catch (err) {
    return null;
  }
};

export { getJWTPayload, verifyJWT };

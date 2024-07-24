import jwt from "jsonwebtoken";

type HeadersType = {
  headers: {
    authorization: string;
  };
};

const jwtSecret = process.env.JWT_SECRET as string;
const verifyJWT = (requestHeaders: HeadersType) => {
  // Get the JWT token from the request headers argument
  const token = requestHeaders.headers.authorization?.replace("Bearer ", "");

  if (!token || jwt.verify(token, jwtSecret)) return false;

  return true;
};

export default verifyJWT;

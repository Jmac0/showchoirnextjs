import jwt from "jsonwebtoken";

type HeadersType = {
  headers: {
    authorization: string;
  };
};

const jwtSecret = process.env.JWT_SECRET as string;
// function to verify JWT token
const verifyJWT = (requestHeaders: HeadersType["headers"]) => {
  // Get the JWT token from the request headers argument
  const tokenString = requestHeaders.authorization;
  if (!tokenString || !tokenString.startsWith("Bearer ")) return false;
  // Get only the JWT token from the token string
  const token = tokenString.split(" ")[1];
  if (!token) return false;

  try {
    // jwt.verify will throw an error if the token is invalid
    jwt.verify(token, jwtSecret);
  } catch (err) {
    if (err) return false;
  }
  return true;
};

export { verifyJWT };

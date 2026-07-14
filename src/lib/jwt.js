import { SignJWT, jwtVerify } from "jose";
import { JWT_SECRET } from "../config/auth";

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload, expiresIn = "1d") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

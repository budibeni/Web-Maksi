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

export async function getCurrentUsername(request) {
  try {
    const token = request.cookies.get(process.env.AUTH_COOKIE_NAME || "maksi_token")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return payload ? (payload.username || payload.nama) : null;
  } catch (error) {
    return null;
  }
}

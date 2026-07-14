import { NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";
import { AUTH_COOKIE_NAME } from "./config/auth";

const publicRoutes = ["/login"];

export async function proxy(request) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith("/api") || path.startsWith("/_next") || path.match(/\.(.*)$/)) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let payload = null;
  
  if (token) {
    payload = await verifyToken(token);
  }
  
  const isPublicRoute = publicRoutes.includes(path);
  
  if (!payload && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (payload && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

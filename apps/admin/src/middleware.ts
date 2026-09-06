import { NextResponse, type NextRequest } from "next/server";
import { getRole } from "@/lib/auth";

export function middleware(request: NextRequest) {
  if (getRole(request) !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

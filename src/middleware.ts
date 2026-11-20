import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Route-level guard for pages (API routes check roles themselves with requireRole()).
const adminOnly = ["/drivers"];
const staffOnly = ["/buses", "/trips", "/maintenance", "/analytics", "/dashboard"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;
  let role: string | null = null;
  if (token) {
    try { role = (await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))).payload.role as string; } catch {}
  }
  if (!role) return NextResponse.redirect(new URL("/login", req.url));
  if (adminOnly.some((p) => pathname.startsWith(p)) && role !== "ADMIN") return NextResponse.redirect(new URL(role === "DRIVER" ? "/my-trips" : "/dashboard", req.url));
  if (staffOnly.some((p) => pathname.startsWith(p)) && role === "DRIVER") return NextResponse.redirect(new URL("/my-trips", req.url));
  if (pathname.startsWith("/my-trips") && role !== "DRIVER") return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/buses/:path*", "/drivers/:path*", "/trips/:path*", "/routes/:path*",
            "/incidents/:path*", "/maintenance/:path*", "/analytics/:path*", "/my-trips/:path*"],
};

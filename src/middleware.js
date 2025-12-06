import { NextResponse } from "next/server";

export function middleware(request) {
  const response = NextResponse.next();

  // ----------------------------
  // SECURITY HEADERS (Override to ensure they're always set)
  // ----------------------------
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CSP - Must match next.config.mjs and include all necessary resources
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
      "connect-src 'self' https://*.supabase.co https://www.strava.com https://vercel.live wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  // ----------------------------
  // CORS ONLY FOR API ROUTES
  // ----------------------------
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // For API routes, set restrictive CORS
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      "https://nahednakib.vercel.app",
      "http://localhost:3000",
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (!origin) {
      // Same-origin request
      response.headers.set("Access-Control-Allow-Origin", request.nextUrl.origin);
    }
    // If origin doesn't match, don't set CORS header (browser will block)

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    // REMOVE CORS from normal pages (override Vercel CDN headers)
    response.headers.delete("Access-Control-Allow-Origin");
    response.headers.delete("Access-Control-Allow-Methods");
    response.headers.delete("Access-Control-Allow-Headers");
    response.headers.delete("Access-Control-Allow-Credentials");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};



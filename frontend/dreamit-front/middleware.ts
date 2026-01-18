import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["es", "en"];
const defaultLocale = "es";

// Helper to detect the user's preferred language
function getLocale(request: NextRequest): string {
  // 1. Get the "Accept-Language" header from the request
  const headers = { "accept-language": request.headers.get("accept-language") || "" };
  
  // 2. Use 'negotiator' to parse the languages (e.g., "en-US,en;q=0.9")
  const languages = new Negotiator({ headers }).languages();
  
  // 3. Match their preferences against your supported locales
  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- IGNORE INTERNAL PATHS ---
  // Do not run middleware for static files, images, or Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || // if you have API routes
    pathname.includes(".") // ignores files like favicon.ico, robot.txt, etc
  ) {
    return NextResponse.next();
  }

  // --- CHECK IF PATH ALREADY HAS A LOCALE ---
  // If the path is "/en" or "/en/about", we are good.
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameHasLocale) return NextResponse.next();

  // --- ROOT PATH HANDLING ("/") ---
  if (pathname === "/") {
    const preferredLocale = getLocale(request);

    // A. If user wants English, REDIRECT them to /en
    if (preferredLocale === "en") {
      return NextResponse.redirect(new URL("/en", request.url));
    }

    // B. If user wants Spanish (or any other language),
    // we REWRITE them to the default folder (/es), but keep the URL as "/"
    return NextResponse.rewrite(new URL(`/${defaultLocale}`, request.url));
  }

  // --- FALLBACK ---
  // If user visits "/about" (no locale), assume default locale
  // Rewrite to "/es/about"
  return NextResponse.rewrite(
    new URL(`/${defaultLocale}${pathname}`, request.url)
  );
}

export const config = {
  // Matcher ignoring static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
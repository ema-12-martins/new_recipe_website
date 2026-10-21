import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE, detectLocale, isLocale } from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (isLocale(firstSegment)) {
    return updateSession(request);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : detectLocale(request.headers.get("accept-language"));

  // Built relative to request.url so the redirect can never leave this origin.
  const target = new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url);
  return NextResponse.redirect(target, 307);
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/static|_next/image|favicon\\.ico$|sw\\.js$|offline\\.html$|offline\\.js$|.*\\.[^/]+$).*)",
  ],
};

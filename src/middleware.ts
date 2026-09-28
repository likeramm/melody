import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/session";

// 로그인 없이 접근 가능한 경로.
// /auth/expired 는 무효 쿠키를 지우는 곳이라 반드시 통과시켜야 합니다.
// 막으면 ?next=/auth/expired 가 붙어, 다시 로그인하자마자 또 로그아웃됩니다.
const PUBLIC_PATHS = ["/login", "/auth/expired"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isPublic(pathname)) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", req.url);
    // 로그인 후 원래 가려던 곳으로 복귀시킵니다.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

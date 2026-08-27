import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, homePathFor, isStaff, verifySession } from "@/lib/session";

// 로그인 없이 접근 가능한 경로
// 이 경로들은 미들웨어를 통과시키되, API 는 각자 토큰으로 스스로를 보호합니다.
const PUBLIC_PATHS = ["/login", "/apply", "/api/cron", "/api/admin/seed"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  // 로그인 상태로 /login 에 오면 각자의 홈으로 돌려보냅니다.
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL(homePathFor(session.role), req.url));
  }

  if (isPublic(pathname)) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", req.url);
    // 로그인 후 원래 가려던 곳으로 복귀시킵니다.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 학부모 계정은 포털 밖으로 나갈 수 없습니다.
  if (!isStaff(session.role) && !pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  // 직원 계정이 포털을 열면 업무 대시보드로 되돌립니다.
  if (isStaff(session.role) && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // 정적 자산과 이미지 최적화 경로는 검사하지 않습니다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

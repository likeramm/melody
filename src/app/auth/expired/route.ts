import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * 무효가 된 로그인 쿠키를 지우고 로그인 화면으로 보냅니다.
 *
 * 비밀번호를 바꾸면 다른 기기의 쿠키는 서명은 멀쩡한데 더 이상 받아주지 않습니다.
 * 이 쿠키가 남아 있으면 미들웨어는 로그인된 것으로 보고 /login 을 /dashboard 로,
 * 페이지는 다시 /login 으로 보내 무한히 오갑니다. 쿠키는 서버 컴포넌트에서 지울 수 없어
 * 이 경로가 대신 지웁니다.
 */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?expired=1", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

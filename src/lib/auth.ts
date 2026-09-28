import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession, type VerifiedSession } from "@/lib/session";

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** 쿠키의 세션 토큰만 해석합니다. DB 조회 없음. */
export async function getSession(): Promise<VerifiedSession | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * 세션 + DB 상의 실제 계정을 함께 확인합니다.
 * 다음 경우는 로그인되지 않은 것으로 봅니다.
 *  - 계정이 없거나 비활성화됨
 *  - 비밀번호를 바꾸기 전에 발급된 로그인 (다른 기기에 남아 있던 로그인)
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.isActive) return null;

  if (user.passwordChangedAt && session.issuedAt < toSeconds(user.passwordChangedAt)) {
    return null;
  }
  return user;
}

/**
 * 로그인하지 않았으면 로그인 화면으로 보냅니다.
 *
 * 곧장 /login 으로 보내면 안 됩니다. 서명은 멀쩡하지만 무효가 된 쿠키가 남아 있으면
 * 미들웨어가 /login 을 다시 /dashboard 로 돌려보내 무한히 오가게 됩니다.
 * 서버 컴포넌트에서는 쿠키를 지울 수 없으므로, 쿠키를 지우는 경로를 한 번 거칩니다.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/expired");
  return user;
}

/** JWT 의 iat 는 초 단위라 비교할 시각도 초 단위로 맞춥니다. */
export function toSeconds(d: Date) {
  return Math.floor(d.getTime() / 1000);
}

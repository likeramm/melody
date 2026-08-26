import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, isStaff, verifySession, type SessionPayload } from "@/lib/session";

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** 쿠키의 세션 토큰만 해석합니다. DB 조회 없음. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** 세션 + DB 상의 실제 계정을 함께 확인합니다. 퇴사 처리(isActive=false)된 계정은 걸러집니다. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.isActive) return null;
  return user;
}

/** 로그인하지 않았으면 로그인 화면으로 보냅니다. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 직원용 화면 진입점. 학부모 계정은 포털로 되돌립니다. */
export async function requireStaff(): Promise<User> {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/portal");
  return user;
}

/** 특정 권한이 필요한 화면/액션에 사용합니다. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** 원장·관리자만 가능한 결재/설정 동작인지 판정합니다. */
export function canApprove(role: Role) {
  return role === "ADMIN" || role === "DIRECTOR";
}

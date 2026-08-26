// jose 의 통합 진입점은 JWE(압축) 코드까지 끌고 들어와 Edge 런타임 경고를 냅니다.
// middleware 는 Edge 에서 돌기 때문에 필요한 서브패스만 가져옵니다.
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { Role } from "@prisma/client";

// 이 파일은 Edge 런타임(middleware)에서도 import 되므로
// Node 전용 모듈(bcrypt, prisma)을 절대 들여오지 않습니다.

export const SESSION_COOKIE = "melody_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export type SessionPayload = {
  sub: string; // User.id
  email: string;
  name: string;
  role: Role;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET 환경 변수가 설정되지 않았습니다. .env 를 확인하세요.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
    };
  } catch {
    // 만료·위조된 토큰은 비로그인과 동일하게 취급합니다.
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

// 학부모(PARENT)는 HQ 내부 화면에 접근할 수 없고,
// 직원 계정은 학부모 포털에 접근할 필요가 없습니다.
export const STAFF_ROLES: Role[] = ["ADMIN", "DIRECTOR", "TEACHER", "STAFF"];

export function isStaff(role: Role | undefined | null) {
  return !!role && STAFF_ROLES.includes(role);
}

export function homePathFor(role: Role) {
  return role === "PARENT" ? "/portal" : "/dashboard";
}

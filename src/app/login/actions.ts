"use server";

import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, homePathFor, sessionCookieOptions, signSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
  // formData.get() 은 값이 없을 때 undefined 가 아니라 null 을 돌려주므로
  // optional() 만으로는 통과하지 못합니다.
  next: z.string().nullish(),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const { email, password, next } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // 계정 존재 여부가 드러나지 않도록 실패 사유를 구분하지 않습니다.
  const ok = user?.isActive ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 오픈 리다이렉트를 막기 위해 내부 경로만 허용합니다.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  // typedRoutes 는 정적 경로만 추론하므로, 검증을 마친 동적 경로는 단언이 필요합니다.
  redirect((safeNext ?? homePathFor(user.role)) as Route);
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

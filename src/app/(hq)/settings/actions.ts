"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { User } from "@prisma/client";

import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export type SettingsState = { error?: string; ok?: string };

/** 계정 정보가 바뀌면 이 기기의 로그인을 새로 발급해 그대로 이어서 쓰게 합니다. */
async function reissueSession(user: Pick<User, "id" | "email" | "name" | "role">) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

// ── 이메일 변경 ──────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
  currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
});

export async function changeEmail(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { email, currentPassword } = parsed.data;

  // 로그인 아이디가 바뀌는 일이라 본인 확인을 한 번 더 합니다.
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "현재 비밀번호가 맞지 않습니다." };
  }
  if (email === user.email) {
    return { error: "지금 쓰고 계신 이메일과 같습니다." };
  }

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { error: "이미 다른 계정에서 쓰고 있는 이메일입니다." };

  const updated = await prisma.user.update({ where: { id: user.id }, data: { email } });
  await reissueSession(updated);

  revalidatePath("/settings");
  return { ok: `이메일을 ${email} 로 바꿨습니다. 다음 로그인부터 이 주소를 쓰세요.` };
}

// ── 비밀번호 변경 ────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
    // bcrypt 는 72바이트까지만 쓰므로 한글이 섞여도 넘지 않게 64자로 제한합니다.
    newPassword: z
      .string()
      .min(8, "새 비밀번호는 8자 이상이어야 합니다.")
      .max(64, "새 비밀번호는 64자까지 쓸 수 있습니다."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "새 비밀번호와 확인이 서로 다릅니다.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "지금 비밀번호와 다른 비밀번호를 정해 주세요.",
  });

export async function changePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { currentPassword, newPassword } = parsed.data;

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "현재 비밀번호가 맞지 않습니다." };
  }

  // 로그인 발급 시각(초 단위)과 비교하므로 초 단위로 맞춰 저장합니다.
  // 이 시각 이전에 발급된 로그인, 즉 다른 기기에 남아 있던 로그인은 모두 끊깁니다.
  const changedAt = new Date(Math.floor(Date.now() / 1000) * 1000);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), passwordChangedAt: changedAt },
  });

  // 비밀번호를 바꾼 이 기기는 새 로그인을 발급해 그대로 이어서 씁니다.
  await reissueSession(updated);

  revalidatePath("/settings");
  return { ok: "비밀번호를 바꿨습니다. 다른 기기에 로그인돼 있던 곳은 모두 로그아웃됩니다." };
}

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

// ── 계정 관리 ────────────────────────────────────────────────

const newAccountSchema = z
  .object({
    name: z.string().trim().min(1, "이름을 입력하세요.").max(40),
    email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다.")
      .max(64, "비밀번호는 64자까지 쓸 수 있습니다."),
    confirmPassword: z.string(),
    currentPassword: z.string().min(1, "내 현재 비밀번호를 입력하세요."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "비밀번호와 확인이 서로 다릅니다.",
  });

/**
 * 로그인할 수 있는 계정을 하나 더 만듭니다.
 * 누군가 자리를 비운 사이 계정이 늘어나지 않도록, 만드는 사람의 비밀번호로 한 번 더 확인합니다.
 */
export async function createAccount(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  if (user.role !== "ADMIN") return { error: "계정은 원장 계정에서만 만들 수 있습니다." };
  const parsed = newAccountSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { name, email, password, currentPassword } = parsed.data;
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "내 현재 비밀번호가 맞지 않습니다." };
  }

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { error: "이미 다른 계정에서 쓰고 있는 이메일입니다." };

  // 새 계정은 담당자(STAFF)로 만듭니다. 학원 데이터는 똑같이 쓰지만 계정 관리는 못 해,
  // 원장 계정이 잠기는 일이 없습니다.
  // passwordChangedAt 을 비워 두어, 새 계정 주인이 처음 로그인하면 비밀번호를 바꾸라는 안내가 보이게 합니다.
  await prisma.user.create({
    data: { name, email, role: "STAFF", passwordHash: await hashPassword(password) },
  });

  revalidatePath("/settings");
  return { ok: `${name} 계정을 만들었습니다. ${email} 로 로그인할 수 있습니다.` };
}

/**
 * 계정 사용을 멈추거나 다시 켭니다. 지우지 않으므로 그 사람이 남긴 기록은 그대로입니다.
 * 멈추는 즉시 그 계정의 모든 로그인이 끊깁니다.
 */
export async function setAccountActive(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id || id === user.id) return; // 자기 계정은 여기서 끌 수 없습니다.

  await prisma.user.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/settings");
}

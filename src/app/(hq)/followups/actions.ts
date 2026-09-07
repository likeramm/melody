"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null)
  .nullish();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "날짜 형식이 올바르지 않습니다.")
  .nullish();

export type FormState = { error?: string; ok?: boolean };

const logSchema = z
  .object({
    target: z.string().trim().min(1, "연락 대상을 선택하세요."),
    contactedAt: z.string().trim().min(1, "연락일을 입력하세요."),
    type: z.enum(["PHONE", "KAKAO", "EMAIL", "SMS", "VISIT", "ETC"]).default("PHONE"),
    summary: z.string().trim().min(1, "연락 내용을 입력하세요.").max(1000),
    nextContactAt: optionalDate,
    followUpNeeded: z
      .string()
      .optional()
      .transform((v) => v === "on" || v === "true"),
  })
  .transform((d) => {
    // target 은 "student:<id>" 또는 "vendor:<id>" 형태로 옵니다.
    const [kind, id] = d.target.split(":");
    return { ...d, kind, targetId: id };
  })
  .refine((d) => (d.kind === "student" || d.kind === "vendor") && !!d.targetId, {
    message: "연락 대상이 올바르지 않습니다.",
  });

export async function addContactLog(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = logSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const d = parsed.data;
  const contactedAt = new Date(d.contactedAt);
  if (Number.isNaN(contactedAt.getTime())) return { error: "연락일이 올바르지 않습니다." };

  const isStudent = d.kind === "student";

  await prisma.contactLog.create({
    data: {
      studentId: isStudent ? d.targetId : null,
      vendorId: isStudent ? null : d.targetId,
      contactedAt,
      type: d.type,
      summary: d.summary,
      nextContactAt: d.nextContactAt,
      followUpNeeded: d.followUpNeeded,
      ownerId: user.id,
    },
  });

  // 다음 연락 예정일을 대상에도 반영해 목록에서 바로 보이게 합니다.
  if (d.nextContactAt) {
    if (isStudent) {
      await prisma.student.update({
        where: { id: d.targetId },
        data: { nextContactAt: d.nextContactAt },
      });
    } else {
      await prisma.vendor.update({
        where: { id: d.targetId },
        data: { nextContactAt: d.nextContactAt },
      });
    }
  }

  revalidatePath("/followups");
  revalidatePath("/dashboard");
  if (isStudent) revalidatePath(`/students/${d.targetId}`);
  else revalidatePath(`/vendors/${d.targetId}`);
  return { ok: true };
}

/** Follow-up 을 처리 완료로 표시합니다. 기록 자체는 남습니다. */
export async function completeFollowUp(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.contactLog.update({
    where: { id },
    data: { completedAt: new Date() },
  });

  revalidatePath("/followups");
  revalidatePath("/dashboard");
}

export async function deleteContactLog(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.contactLog.delete({ where: { id } });
  revalidatePath("/followups");
  revalidatePath("/dashboard");
}

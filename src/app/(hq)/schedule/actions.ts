"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPES = [
  "OPENING",
  "RECRUITMENT",
  "PRE_REGISTRATION",
  "SEMESTER",
  "VACATION",
  "SPECIAL_CLASS",
  "ADMISSION_TEST",
  "EVENT",
  "VOLUNTEER",
  "PARENT_CONSULT",
  "CONTENT",
  "AD",
  "CONSTRUCTION",
  "ADMIN",
  "ETC",
] as const;

const STATUSES = ["PLANNED", "IN_PROGRESS", "DONE", "ON_HOLD"] as const;

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

const milestoneSchema = z.object({
  title: z.string().trim().min(1, "일정 이름을 입력하세요.").max(120),
  type: z.enum(TYPES).default("ETC"),
  goal: optionalText,
  startAt: optionalDate,
  dueDate: optionalDate,
  status: z.enum(STATUSES).default("PLANNED"),
  progress: z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .refine((n) => Number.isFinite(n) && n >= 0 && n <= 100, "완료율은 0~100 이어야 합니다."),
  projectId: optionalText,
});

export async function createMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  await prisma.milestone.create({ data: { ...parsed.data, ownerId: user.id } });

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** 목록에서 상태와 완료율만 빠르게 바꿉니다. */
export async function updateMilestoneProgress(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const progressRaw = Number(formData.get("progress") ?? 0);
  if (!id || !STATUSES.includes(statusRaw as (typeof STATUSES)[number])) return;

  const progress = Number.isFinite(progressRaw)
    ? Math.min(100, Math.max(0, Math.round(progressRaw)))
    : 0;
  const status = statusRaw as (typeof STATUSES)[number];

  await prisma.milestone.update({
    where: { id },
    // 완료로 바꾸면 완료율도 100 으로 맞춥니다.
    data: { status, progress: status === "DONE" ? 100 : progress },
  });

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function deleteMilestone(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.milestone.delete({ where: { id } });
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

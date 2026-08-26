"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

// 홈페이지에 노출되는 공개 폼이므로 입력을 엄격하게 검증합니다.
const applySchema = z.object({
  studentName: z.string().trim().min(1, "학생 이름을 입력하세요.").max(40),
  grade: z.string().trim().max(20).optional().or(z.literal("")),
  level: z
    .enum(["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED"])
    .optional()
    .or(z.literal("")),
  parentName: z.string().trim().min(1, "학부모 성함을 입력하세요.").max(40),
  parentPhone: z
    .string()
    .trim()
    .regex(/^[0-9-]{9,20}$/, "연락처는 숫자와 하이픈만 입력할 수 있습니다."),
  parentEmail: z.string().trim().email("이메일 형식이 올바르지 않습니다.").optional().or(z.literal("")),
  preferredAt: z.string().optional().or(z.literal("")),
  type: z.enum(["NEW_INQUIRY", "ADMISSION_TEST", "PROGRESS_REVIEW", "RE_ENROLLMENT"]),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ApplyState = { ok?: boolean; error?: string };

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = applySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const d = parsed.data;
  const preferredAt = d.preferredAt ? new Date(d.preferredAt) : null;

  if (preferredAt && Number.isNaN(preferredAt.getTime())) {
    return { error: "희망 시간이 올바르지 않습니다." };
  }

  try {
    await prisma.consultation.create({
      data: {
        applicantStudentName: d.studentName,
        applicantGrade: d.grade || null,
        applicantLevel: d.level || null,
        parentName: d.parentName,
        parentPhone: d.parentPhone,
        parentEmail: d.parentEmail || null,
        preferredAt,
        type: d.type,
        status: "PENDING",
        summary: d.message || null,
        source: "homepage",
      },
    });
  } catch {
    return { error: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true };
}

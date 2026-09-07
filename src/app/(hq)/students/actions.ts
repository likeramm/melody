"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS = [
  "NEW_INQUIRY",
  "CONSULT_BOOKED",
  "ASSESSED",
  "ENROLLMENT_REVIEW",
  "ENROLLED",
  "ON_LEAVE",
  "WITHDRAWN",
  "NOT_ENROLLED",
] as const;

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

const optionalInt = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((n) => n === null || (Number.isFinite(n) && n >= 0 && n <= 100), "0~100 사이여야 합니다.")
  .nullish();

export type FormState = { error?: string; ok?: boolean };

// ── 학생 / 상담자 ────────────────────────────────────────────

const studentSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요.").max(40),
  school: optionalText,
  grade: optionalText,
  phone: optionalText,
  status: z.enum(STATUS).default("NEW_INQUIRY"),
  source: optionalText,
  firstInquiryAt: optionalDate,
  consultedAt: optionalDate,
  assessedAt: optionalDate,
  consultationNote: optionalText,
  assessmentResult: optionalText,
  level: optionalText,
  evaluation: optionalText,
  recommendedClass: optionalText,
  enrolledAt: optionalDate,
  notEnrolledReason: optionalText,
  nextContactAt: optionalDate,
  nextGoal: optionalText,
  memo: optionalText,
  classGroupId: optionalText,
  // 보호자는 신규 등록 시 한 명만 함께 받습니다.
  guardianName: optionalText,
  guardianPhone: optionalText,
  guardianRelation: z.enum(["MOTHER", "FATHER", "OTHER"]).default("MOTHER"),
});

export async function createStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { guardianName, guardianPhone, guardianRelation, ...d } = parsed.data;

  await prisma.student.create({
    data: {
      ...d,
      // 문의로 들어온 순간을 기록해 두면 나중에 유입 분석에 씁니다.
      firstInquiryAt: d.firstInquiryAt ?? new Date(),
      guardians: guardianName
        ? {
            create: [
              {
                name: guardianName,
                phone: guardianPhone,
                relation: guardianRelation,
                isPrimary: true,
              },
            ],
          }
        : undefined,
    },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = studentSchema.extend({ id: z.string().min(1) }).safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { id, guardianName, guardianPhone, guardianRelation, ...d } = parsed.data;
  void guardianName;
  void guardianPhone;
  void guardianRelation;

  await prisma.student.update({ where: { id }, data: d });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * 상태만 바꿉니다. 등록으로 넘어가도 기존 상담·시험 기록은 그대로 남습니다.
 * (명세 자동화 1번)
 */
export async function changeStudentStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUS.includes(status as (typeof STATUS)[number])) return;

  const next = status as (typeof STATUS)[number];
  const current = await prisma.student.findUnique({ where: { id }, select: { enrolledAt: true } });

  await prisma.student.update({
    where: { id },
    data: {
      status: next,
      // 처음 등록되는 순간에만 등록일을 찍습니다.
      enrolledAt: next === "ENROLLED" && !current?.enrolledAt ? new Date() : undefined,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/dashboard");
}

/** 학생 페이지에서 메모만 빠르게 덧붙입니다. */
export async function appendStudentMemo(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("memo") ?? "").trim();
  if (!id || !text) return;

  const student = await prisma.student.findUnique({ where: { id }, select: { memo: true } });
  const stamp = new Date().toLocaleDateString("ko-KR");
  const next = student?.memo ? `${student.memo}
${stamp} ${text}` : `${stamp} ${text}`;

  await prisma.student.update({ where: { id }, data: { memo: next } });
  revalidatePath(`/students/${id}`);
}

export async function deleteStudent(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
  revalidatePath("/dashboard");
}

// ── 보호자 ───────────────────────────────────────────────────

export async function addGuardian(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z
    .object({
      studentId: z.string().min(1),
      name: z.string().trim().min(1, "보호자 이름을 입력하세요.").max(40),
      relation: z.enum(["MOTHER", "FATHER", "OTHER"]).default("MOTHER"),
      phone: optionalText,
      email: optionalText,
      memo: optionalText,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { studentId, ...d } = parsed.data;
  const count = await prisma.guardian.count({ where: { studentId } });
  await prisma.guardian.create({
    data: { ...d, studentId, isPrimary: count === 0 },
  });

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

// ── 입학시험 / 인터뷰 (명세 4번) ─────────────────────────────

const assessmentSchema = z.object({
  studentId: z.string().min(1),
  takenAt: z.string().trim().min(1, "시험일을 입력하세요."),
  reading: optionalInt,
  listening: optionalInt,
  speaking: optionalInt,
  writing: optionalInt,
  grammar: optionalInt,
  vocabulary: optionalInt,
  resultSummary: optionalText,
  interviewNote: optionalText,
  decision: z
    .enum(["PASS", "CONDITIONAL", "FAIL"])
    .nullish()
    .or(z.literal("").transform(() => null)),
  recommendation: optionalText,
  reportUrl: optionalText,
  deliveredAt: optionalDate,
});

export async function addAssessment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { studentId, takenAt, ...d } = parsed.data;
  const takenDate = new Date(takenAt);
  if (Number.isNaN(takenDate.getTime())) return { error: "시험일이 올바르지 않습니다." };

  // 입력된 영역 점수의 평균을 총점으로 씁니다.
  const scores = [d.reading, d.listening, d.speaking, d.writing, d.grammar, d.vocabulary].filter(
    (n): n is number => typeof n === "number",
  );
  const totalScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  await prisma.assessment.create({
    data: { ...d, studentId, takenAt: takenDate, totalScore, assessorId: user.id },
  });

  // 시험을 치렀으면 학생 기록에도 시험일을 남깁니다. (명세 자동화 3번)
  await prisma.student.update({
    where: { id: studentId },
    data: {
      assessedAt: takenDate,
      assessmentResult: d.resultSummary ?? undefined,
    },
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Portfolio ────────────────────────────────────────────────

export async function addPortfolio(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z
    .object({
      studentId: z.string().min(1),
      title: z.string().trim().min(1, "결과물 이름을 입력하세요.").max(120),
      url: optionalText,
      producedAt: optionalDate,
      memo: optionalText,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { studentId, ...d } = parsed.data;
  await prisma.portfolio.create({ data: { ...d, studentId } });

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

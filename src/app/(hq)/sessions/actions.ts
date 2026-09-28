"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ATTENDANCE = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null)
  .nullish();

export type FormState = { error?: string; ok?: boolean };

const sessionSchema = z.object({
  date: z.string().trim().min(1, "수업일을 입력하세요."),
  classGroupId: optionalText,
  lessonId: optionalText,
  topic: optionalText,
  content: optionalText,
  homework: optionalText,
  note: optionalText,
});

/**
 * 수업 회차를 만들고, 해당 반 학생 전원의 기록 행을 미리 만들어 둡니다.
 * 이렇게 해두면 출결·과제·점수를 표에서 한 번에 채울 수 있습니다.
 */
export async function createSession(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = sessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { date, classGroupId, ...d } = parsed.data;
  const sessionDate = new Date(date);
  if (Number.isNaN(sessionDate.getTime())) return { error: "수업일이 올바르지 않습니다." };

  const students = classGroupId
    ? await prisma.student.findMany({
        where: { classGroupId, status: { in: ["ENROLLED", "ON_LEAVE"] } },
        select: { id: true },
      })
    : [];

  const session = await prisma.classSession.create({
    data: {
      ...d,
      date: sessionDate,
      classGroupId,
      teacherId: user.id,
      records: {
        create: students.map((s) => ({ studentId: s.id })),
      },
    },
  });

  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  // 수업을 만드는 목적은 곧바로 출결·점수를 적는 것이라, 그 화면으로 바로 보냅니다.
  redirect(`/sessions/${session.id}` as Route);
}

export async function deleteSession(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.classSession.delete({ where: { id } });
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
}

const scoreField = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((n) => n === null || (Number.isFinite(n) && n >= 0 && n <= 100), "0~100 사이여야 합니다.");

/**
 * 수업 1회의 학생별 기록을 표째로 저장합니다.
 * 필드 이름은 `<필드>__<recordId>` 형태로 보냅니다.
 */
export async function saveSessionRecords(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return { error: "수업 정보를 찾을 수 없습니다." };

  const records = await prisma.studentSessionRecord.findMany({
    where: { sessionId },
    select: { id: true },
  });

  const updates = [];
  for (const { id } of records) {
    const get = (name: string) => String(formData.get(`${name}__${id}`) ?? "");

    const attendanceRaw = get("attendance");
    const attendance = ATTENDANCE.includes(attendanceRaw as (typeof ATTENDANCE)[number])
      ? (attendanceRaw as (typeof ATTENDANCE)[number])
      : "PRESENT";

    const homeworkRaw = get("homeworkSubmitted");
    const homeworkSubmitted =
      homeworkRaw === "yes" ? true : homeworkRaw === "no" ? false : null;

    const numbers: Record<string, number | null> = {};
    for (const key of ["quizScore", "testScore", "reading", "writing", "speaking", "debate"]) {
      const parsed = scoreField.safeParse(get(key));
      if (!parsed.success) return { error: `${key}: ${parsed.error.issues[0]?.message}` };
      numbers[key] = parsed.data;
    }

    updates.push(
      prisma.studentSessionRecord.update({
        where: { id },
        data: {
          attendance,
          homeworkSubmitted,
          quizScore: numbers.quizScore,
          testScore: numbers.testScore,
          reading: numbers.reading,
          writing: numbers.writing,
          speaking: numbers.speaking,
          debate: numbers.debate,
          teacherComment: get("teacherComment").trim() || null,
          parentFeedback: get("parentFeedback").trim() || null,
        },
      }),
    );
  }

  // 한 번에 저장해 중간에 실패하면 아무것도 반영되지 않게 합니다.
  await prisma.$transaction(updates);

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/students");
  return { ok: true };
}

/** 반에 새로 들어온 학생 등, 기록 행이 없는 학생을 수업에 추가합니다. */
export async function addStudentToSession(formData: FormData) {
  await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!sessionId || !studentId) return;

  await prisma.studentSessionRecord.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    update: {},
    create: { sessionId, studentId },
  });

  revalidatePath(`/sessions/${sessionId}`);
}

/**
 * 기록 표 안의 줄 삭제 버튼에서 부릅니다. 표 전체가 하나의 폼이라
 * 지울 줄의 id 는 폼 값이 아니라 bind 로 받습니다.
 */
export async function removeStudentFromSession(id: string, formData: FormData) {
  await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!id) return;
  await prisma.studentSessionRecord.delete({ where: { id } });
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/students");
}

// ── 수강반 ───────────────────────────────────────────────────

export async function createClassGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(1, "반 이름을 입력하세요.").max(60),
      schedule: optionalText,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  try {
    await prisma.classGroup.create({ data: parsed.data });
  } catch {
    return { error: "같은 이름의 반이 이미 있습니다." };
  }

  revalidatePath("/sessions");
  revalidatePath("/students");
  return { ok: true };
}

export async function updateClassGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z
    .object({
      id: z.string().min(1),
      name: z.string().trim().min(1, "반 이름을 입력하세요.").max(60),
      schedule: optionalText,
      // 체크하면 목록에서 숨깁니다. 학생·수업 기록은 그대로 남습니다.
      closed: z
        .string()
        .optional()
        .transform((v) => v === "on"),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { id, closed, ...d } = parsed.data;
  try {
    await prisma.classGroup.update({ where: { id }, data: { ...d, isActive: !closed } });
  } catch {
    return { error: "같은 이름의 반이 이미 있습니다." };
  }

  revalidatePath("/sessions");
  revalidatePath("/students");
  return { ok: true };
}

export async function updateSession(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = sessionSchema
    .extend({ id: z.string().min(1) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { id, date, ...d } = parsed.data;
  const sessionDate = new Date(date);
  if (Number.isNaN(sessionDate.getTime())) return { error: "수업일이 올바르지 않습니다." };

  await prisma.classSession.update({ where: { id }, data: { ...d, date: sessionDate } });

  revalidatePath(`/sessions/${id}`);
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return { ok: true };
}

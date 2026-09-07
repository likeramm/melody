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

// ── 학기 ─────────────────────────────────────────────────────

export async function createSemester(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(1, "학기 이름을 입력하세요.").max(40),
      startDate: optionalDate,
      endDate: optionalDate,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  try {
    await prisma.semester.create({ data: parsed.data });
  } catch {
    return { error: "같은 이름의 학기가 이미 있습니다." };
  }

  revalidatePath("/curriculum");
  return { ok: true };
}

// ── 커리큘럼 ─────────────────────────────────────────────────

export async function createCurriculum(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z
    .object({
      semesterId: z.string().min(1, "학기를 선택하세요."),
      title: z.string().trim().min(1, "커리큘럼 이름을 입력하세요.").max(120),
      level: optionalText,
      description: optionalText,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  try {
    await prisma.curriculum.create({ data: parsed.data });
  } catch {
    return { error: "같은 학기에 같은 이름의 커리큘럼이 이미 있습니다." };
  }

  revalidatePath("/curriculum");
  return { ok: true };
}

/**
 * 커리큘럼을 다음 학기로 복제합니다. 수업 내용은 그대로 가져오고
 * 사용 날짜와 수정사항은 비워, 새 학기에 맞게 고쳐 쓰도록 합니다.
 */
export async function copyCurriculum(formData: FormData) {
  await requireUser();
  const sourceId = String(formData.get("sourceId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  if (!sourceId || !semesterId) return;

  const source = await prisma.curriculum.findUnique({
    where: { id: sourceId },
    include: { lessons: { orderBy: { sortOrder: "asc" } } },
  });
  if (!source) return;

  const target = await prisma.semester.findUnique({
    where: { id: semesterId },
    select: { name: true },
  });
  if (!target) return;

  // 같은 학기에 같은 이름이 있으면 뒤에 표시를 붙입니다.
  const exists = await prisma.curriculum.findFirst({
    where: { semesterId, title: source.title },
    select: { id: true },
  });
  const title = exists ? `${source.title} (복사본)` : source.title;

  await prisma.curriculum.create({
    data: {
      semesterId,
      title,
      level: source.level,
      description: source.description,
      lessons: {
        create: source.lessons.map((l) => ({
          week: l.week,
          sortOrder: l.sortOrder,
          topic: l.topic,
          learningObjective: l.learningObjective,
          reading: l.reading,
          lecture: l.lecture,
          discussionQuestions: l.discussionQuestions,
          writing: l.writing,
          studentPortfolio: l.studentPortfolio,
          lecturePptUrl: l.lecturePptUrl,
          worksheetUrl: l.worksheetUrl,
          assignments: l.assignments,
          teacherNotes: l.teacherNotes,
          copiedFromId: l.id,
        })),
      },
    },
  });

  revalidatePath("/curriculum");
}

export async function deleteCurriculum(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.curriculum.delete({ where: { id } });
  revalidatePath("/curriculum");
}

// ── 수업 (Lesson) ────────────────────────────────────────────

const lessonSchema = z.object({
  curriculumId: z.string().min(1),
  week: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((n) => n === null || (Number.isInteger(n) && n > 0), "주차는 1 이상의 정수여야 합니다.")
    .nullish(),
  topic: z.string().trim().min(1, "주제를 입력하세요.").max(200),
  learningObjective: optionalText,
  reading: optionalText,
  lecture: optionalText,
  discussionQuestions: optionalText,
  writing: optionalText,
  studentPortfolio: optionalText,
  lecturePptUrl: optionalText,
  worksheetUrl: optionalText,
  assignments: optionalText,
  teacherNotes: optionalText,
  usedAt: optionalDate,
  revisionNote: optionalText,
});

export async function createLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const count = await prisma.lesson.count({ where: { curriculumId: parsed.data.curriculumId } });
  await prisma.lesson.create({ data: { ...parsed.data, sortOrder: count } });

  revalidatePath("/curriculum");
  return { ok: true };
}

export async function deleteLesson(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.lesson.delete({ where: { id } });
  revalidatePath("/curriculum");
}

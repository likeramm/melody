"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRIORITY = ["P0", "P1", "P2", "LATER"] as const;
const STATUS = ["PLANNED", "IN_PROGRESS", "WAITING_EXTERNAL", "DONE", "ON_HOLD"] as const;

/** 빈 문자열을 null 로 바꿉니다. formData 는 미입력도 "" 로 넘어옵니다. */
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

const taskSchema = z.object({
  title: z.string().trim().min(1, "할 일 제목을 입력하세요.").max(200),
  memo: optionalText,
  priority: z.enum(PRIORITY).default("P2"),
  status: z.enum(STATUS).default("PLANNED"),
  dueDate: optionalDate,
  projectId: optionalText,
  parentTaskId: optionalText,
  linkLabel: optionalText,
  linkUrl: optionalText,
});

export type TaskFormState = { error?: string; ok?: boolean };

export async function createTask(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  await requireUser();
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const d = parsed.data;
  const link =
    d.linkUrl && d.linkUrl.startsWith("http")
      ? { create: [{ label: d.linkLabel || "링크", url: d.linkUrl }] }
      : undefined;

  await prisma.task.create({
    data: {
      title: d.title,
      memo: d.memo,
      priority: d.priority,
      status: d.status,
      dueDate: d.dueDate,
      projectId: d.projectId,
      parentTaskId: d.parentTaskId,
      completedAt: d.status === "DONE" ? new Date() : null,
      links: link,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

const updateSchema = taskSchema.extend({ id: z.string().min(1) });

export async function updateTask(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  await requireUser();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { id, linkLabel, linkUrl, ...d } = parsed.data;
  const existing = await prisma.task.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return { error: "할 일을 찾을 수 없습니다." };

  await prisma.task.update({
    where: { id },
    data: {
      ...d,
      // 완료로 바뀌는 순간에만 완료 시각을 찍고, 되돌리면 지웁니다.
      completedAt:
        d.status === "DONE"
          ? existing.status === "DONE"
            ? undefined
            : new Date()
          : null,
      links:
        linkUrl && linkUrl.startsWith("http")
          ? { create: [{ label: linkLabel || "링크", url: linkUrl }] }
          : undefined,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** 목록에서 체크박스로 바로 완료 처리합니다. */
export async function toggleTaskDone(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const task = await prisma.task.findUnique({ where: { id }, select: { status: true } });
  if (!task) return;

  const done = task.status === "DONE";
  await prisma.task.update({
    where: { id },
    data: {
      status: done ? "PLANNED" : "DONE",
      completedAt: done ? null : new Date(),
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // 하위 작업은 스키마의 onDelete: Cascade 로 함께 지워집니다.
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

const projectSchema = z.object({
  name: z.string().trim().min(1, "프로젝트 이름을 입력하세요.").max(60),
  description: optionalText,
});

export async function createProject(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  await requireUser();
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const count = await prisma.project.count();
  try {
    await prisma.project.create({
      data: { ...parsed.data, sortOrder: count },
    });
  } catch {
    return { error: "같은 이름의 프로젝트가 이미 있습니다." };
  }

  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTaskLink(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.taskLink.delete({ where: { id } });
  revalidatePath("/tasks");
}

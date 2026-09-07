import type { Metadata, Route } from "next";
import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, todayRange, weekRange } from "@/lib/dates";
import {
  OPEN_TASK_STATUSES,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/labels";

import { deleteTask, toggleTaskDone } from "./actions";
import { NewProjectForm, NewTaskForm } from "./task-forms";

export const metadata: Metadata = { title: "할 일" };
export const dynamic = "force-dynamic";

/** 명세 1번의 "오늘 할 일 / 이번 주 / 기한 초과 자동 보기" */
const VIEWS = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "overdue", label: "기한 초과" },
  { key: "open", label: "미완료 전체" },
  { key: "done", label: "완료" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

const PRIORITY_TONE: Record<TaskPriority, "danger" | "warning" | "neutral"> = {
  P0: "danger",
  P1: "warning",
  P2: "neutral",
  LATER: "neutral",
};

const STATUS_TONE: Record<TaskStatus, "neutral" | "info" | "warning" | "success"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "info",
  WAITING_EXTERNAL: "warning",
  DONE: "success",
  ON_HOLD: "neutral",
};

function whereFor(view: ViewKey, projectId?: string): Prisma.TaskWhereInput {
  const today = todayRange();
  const open = { in: [...OPEN_TASK_STATUSES] };
  const base: Prisma.TaskWhereInput = {
    // 하위 작업은 부모 아래에 접어서 보여주므로 목록에서는 제외합니다.
    parentTaskId: null,
    ...(projectId ? { projectId } : {}),
  };

  switch (view) {
    case "today":
      return {
        ...base,
        status: open,
        OR: [{ dueDate: { lte: today.lte } }, { dueDate: null, priority: "P0" }],
      };
    case "week":
      return { ...base, status: open, dueDate: weekRange() };
    case "overdue":
      return { ...base, status: open, dueDate: { lt: today.gte } };
    case "done":
      return { ...base, status: "DONE" };
    case "open":
      return { ...base, status: open };
  }
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; project?: string }>;
}) {
  await requireUser();
  const { view: viewParam, project: projectParam } = await searchParams;
  const view: ViewKey = (VIEWS.find((v) => v.key === viewParam)?.key ?? "today") as ViewKey;

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: { isArchived: false },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { tasks: { where: { status: { in: [...OPEN_TASK_STATUSES] } } } },
        },
      },
    }),
    prisma.task.findMany({
      where: whereFor(view, projectParam),
      include: {
        project: { select: { id: true, name: true } },
        links: true,
        subtasks: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
      take: 200,
    }),
  ]);

  const qs = (next: Partial<{ view: string; project: string }>) => {
    const params = new URLSearchParams();
    params.set("view", next.view ?? view);
    const p = next.project ?? projectParam;
    if (p) params.set("project", p);
    // typedRoutes 는 조립한 쿼리 문자열을 추론하지 못합니다.
    return `/tasks?${params.toString()}` as Route;
  };

  return (
    <>
      <PageHeader
        title="할 일"
        description="프로젝트별로 관리하고, 오늘·이번 주·기한 초과는 자동으로 걸러 보여줍니다."
      />

      {/* 기간 보기 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={qs({ view: v.key })}
            className={
              v.key === view
                ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {v.label}
          </Link>
        ))}
      </div>

      {/* 프로젝트 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/tasks?view=${view}` as Route}
          className={
            !projectParam
              ? "rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
              : "rounded-full border border-border bg-card px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          }
        >
          전체 프로젝트
        </Link>
        {projects.map((p) => (
          <Link
            key={p.id}
            href={qs({ project: p.id })}
            className={
              projectParam === p.id
                ? "rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border bg-card px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            }
          >
            {p.name}
            <span className="ml-1.5 text-xs opacity-70">{p._count.tasks}</span>
          </Link>
        ))}
        <NewProjectForm />
      </div>

      <div className="mb-4">
        <NewTaskForm
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          defaultProjectId={projectParam}
        />
      </div>

      {tasks.length === 0 ? (
        <Card>
          <EmptyState
            message="조건에 맞는 할 일이 없습니다."
            hint={view === "today" ? "오늘 마감이거나 기한 없는 P0 만 표시합니다." : undefined}
          />
        </Card>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const doneSubtasks = task.subtasks.filter((s) => s.status === "DONE").length;
            return (
              <li key={task.id}>
                <Card padded={false} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {/* 체크박스로 바로 완료 처리 */}
                    <form action={toggleTaskDone} className="pt-0.5">
                      <input type="hidden" name="id" value={task.id} />
                      <button
                        type="submit"
                        aria-label={task.status === "DONE" ? "완료 취소" : "완료 처리"}
                        className={
                          task.status === "DONE"
                            ? "flex h-5 w-5 items-center justify-center rounded border-2 border-brand-600 bg-brand-600 text-xs text-white"
                            : "h-5 w-5 rounded border-2 border-slate-300 transition hover:border-brand-400"
                        }
                      >
                        {task.status === "DONE" ? "✓" : ""}
                      </button>
                    </form>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            task.status === "DONE"
                              ? "text-sm font-medium text-muted line-through"
                              : "text-sm font-medium"
                          }
                        >
                          {task.title}
                        </span>
                        <Badge tone={PRIORITY_TONE[task.priority]}>
                          {TASK_PRIORITY_LABEL[task.priority]}
                        </Badge>
                        <Badge tone={STATUS_TONE[task.status]}>
                          {TASK_STATUS_LABEL[task.status]}
                        </Badge>
                        {task.project && <Badge tone="brand">{task.project.name}</Badge>}
                      </div>

                      {task.memo && (
                        <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{task.memo}</p>
                      )}

                      {/* 하위 작업 */}
                      {task.subtasks.length > 0 && (
                        <div className="mt-2">
                          <p className="mb-1 text-xs text-muted">
                            하위 작업 {doneSubtasks}/{task.subtasks.length}
                          </p>
                          <ul className="space-y-1">
                            {task.subtasks.map((s) => (
                              <li key={s.id} className="flex items-center gap-2 text-sm">
                                <form action={toggleTaskDone}>
                                  <input type="hidden" name="id" value={s.id} />
                                  <button
                                    type="submit"
                                    aria-label={s.status === "DONE" ? "완료 취소" : "완료 처리"}
                                    className={
                                      s.status === "DONE"
                                        ? "flex h-4 w-4 items-center justify-center rounded border-2 border-brand-600 bg-brand-600 text-[10px] text-white"
                                        : "h-4 w-4 rounded border-2 border-slate-300"
                                    }
                                  >
                                    {s.status === "DONE" ? "✓" : ""}
                                  </button>
                                </form>
                                <span
                                  className={s.status === "DONE" ? "text-muted line-through" : ""}
                                >
                                  {s.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 파일 / 링크 */}
                      {task.links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {task.links.map((l) => (
                            <a
                              key={l.id}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200"
                            >
                              <ExternalLink size={11} aria-hidden />
                              {l.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs whitespace-nowrap text-muted">
                        {task.dueDate ? fmtDate(task.dueDate) : "기한 없음"}
                      </span>
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <button
                          type="submit"
                          aria-label="삭제"
                          className="rounded p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </form>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

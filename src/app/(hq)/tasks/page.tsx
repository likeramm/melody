import type { Metadata, Route } from "next";
import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, toDateInput, todayRange, weekRange } from "@/lib/dates";
import {
  OPEN_TASK_STATUSES,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
} from "@/lib/labels";

import { deleteTask, deleteTaskLink, restoreProject, setTaskStatus, toggleTaskDone } from "./actions";
import { AddSubtaskForm, TaskEditForm } from "./edit-form";
import { ProjectEditForm, QuickAddTask } from "./quick-forms";
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

/** 상태 드롭다운도 배지처럼 색으로 구분되게 합니다. */
const STATUS_SELECT_TONE: Record<TaskStatus, string> = {
  PLANNED: "",
  // 기본 흰 배경을 덮어야 해서 ! 를 붙입니다.
  IN_PROGRESS: "border-sky-200! bg-sky-50! text-sky-800",
  WAITING_EXTERNAL: "border-amber-200! bg-amber-50! text-amber-800",
  DONE: "border-emerald-200! bg-emerald-50! text-emerald-800",
  ON_HOLD: "text-muted",
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

  const [projects, tasks, archivedProjects] = await Promise.all([
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
    prisma.project.findMany({
      where: { isArchived: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const selectedProject = projects.find((p) => p.id === projectParam);
  // 빠른 추가로 넣은 일이 지금 보기에서 바로 보이도록 마감일 기본값을 맞춥니다.
  const quickDue = view === "today" || view === "week" ? toDateInput(new Date()) : "";

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
        {selectedProject && (
          <ProjectEditForm
            key={selectedProject.id}
            project={{
              id: selectedProject.id,
              name: selectedProject.name,
              description: selectedProject.description,
            }}
          />
        )}
        <NewProjectForm />
      </div>

      <div className="mb-2">
        <QuickAddTask key={`${view}-${projectParam ?? ""}`} projectId={projectParam} defaultDue={quickDue} />
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
                        {/* 고르는 즉시 저장됩니다 */}
                        <form action={setTaskStatus} className="inline-flex">
                          <input type="hidden" name="id" value={task.id} />
                          <AutoSubmitSelect
                            key={task.status}
                            name="status"
                            defaultValue={task.status}
                            aria-label={`${task.title} 상태`}
                            className={STATUS_SELECT_TONE[task.status]}
                          >
                            {TASK_STATUS_ORDER.map((st) => (
                              <option key={st} value={st}>
                                {TASK_STATUS_LABEL[st]}
                              </option>
                            ))}
                          </AutoSubmitSelect>
                        </form>
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
                            <span
                              key={l.id}
                              className="inline-flex items-center overflow-hidden rounded bg-slate-100 text-xs text-slate-700"
                            >
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 py-0.5 pr-1 pl-2 hover:bg-slate-200"
                              >
                                <ExternalLink size={11} aria-hidden />
                                {l.label}
                              </a>
                              {/* 잘못 붙인 링크를 떼어냅니다 */}
                              <form action={deleteTaskLink}>
                                <input type="hidden" name="id" value={l.id} />
                                <ConfirmButton
                                  label={`${l.label} 링크 삭제`}
                                  confirmLabel="뗄까요?"
                                  size={11}
                                  className="p-1"
                                />
                              </form>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <TaskEditForm
                          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                          task={{
                            id: task.id,
                            title: task.title,
                            memo: task.memo,
                            priority: task.priority,
                            status: task.status,
                            dueDate: toDateInput(task.dueDate),
                            projectId: task.projectId,
                          }}
                        />
                        <AddSubtaskForm parentTaskId={task.id} />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs whitespace-nowrap text-muted">
                        {task.dueDate ? fmtDate(task.dueDate) : "기한 없음"}
                      </span>
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <ConfirmButton label="삭제" />
                      </form>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {archivedProjects.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm text-muted">
          <span className="text-xs">보관한 프로젝트</span>
          {archivedProjects.map((p) => (
            <form key={p.id} action={restoreProject}>
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                title="다시 목록에 꺼내기"
                className="rounded-full border border-dashed border-border px-3 py-1 text-xs hover:border-brand-300 hover:text-brand-700"
              >
                {p.name} · 꺼내기
              </button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}

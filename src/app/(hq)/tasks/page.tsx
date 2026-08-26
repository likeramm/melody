import type { Metadata } from "next";
import type { Prisma, TaskStatus } from "@prisma/client";
import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { canApprove, requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";
import { RECURRENCE_LABEL, TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "업무 관리" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "mine", label: "내 업무" },
  { key: "all", label: "전체" },
  { key: "urgent", label: "긴급" },
  { key: "approval", label: "결재 대기" },
  { key: "template", label: "반복 규칙" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const PRIORITY_TONE = {
  URGENT: "danger",
  HIGH: "warning",
  NORMAL: "neutral",
  LOW: "neutral",
} as const;

const STATUS_TONE: Record<TaskStatus, "neutral" | "info" | "warning" | "success"> = {
  TODO: "neutral",
  IN_PROGRESS: "info",
  NEED_APPROVAL: "warning",
  DONE: "success",
  ARCHIVED: "neutral",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireStaff();
  const { filter } = await searchParams;
  const active: FilterKey = (FILTERS.find((f) => f.key === filter)?.key ?? "mine") as FilterKey;

  const where: Prisma.TaskWhereInput = { isTemplate: active === "template" };
  if (active === "mine") where.assigneeId = user.id;
  if (active === "urgent") where.priority = "URGENT";
  if (active === "approval") where.status = "NEED_APPROVAL";
  if (active !== "template" && active !== "approval") {
    where.status = { notIn: ["DONE", "ARCHIVED"] };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { assignee: { select: { name: true } } },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <>
      <PageHeader
        title="업무 관리"
        description="반복 업무는 스케줄러가 규칙에 따라 자동으로 생성합니다."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/tasks?filter=${f.key}`}
            className={
              f.key === active
                ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card padded={false}>
        {tasks.length === 0 ? (
          <div className="p-5">
            <EmptyState message="조건에 맞는 업무가 없습니다." />
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">업무명</th>
                  <th className="px-4 py-3 font-medium">담당자</th>
                  <th className="px-4 py-3 font-medium">마감일</th>
                  <th className="px-4 py-3 font-medium">우선순위</th>
                  <th className="px-4 py-3 font-medium">
                    {active === "template" ? "반복 주기" : "상태"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{task.title}</p>
                      {task.category && <p className="text-xs text-muted">{task.category}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {task.assignee?.name ?? "미배정"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {fmtDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={PRIORITY_TONE[task.priority]}>
                        {TASK_PRIORITY_LABEL[task.priority]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {active === "template" ? (
                        <Badge tone="brand">{RECURRENCE_LABEL[task.recurrence]}</Badge>
                      ) : (
                        <Badge tone={STATUS_TONE[task.status]}>
                          {TASK_STATUS_LABEL[task.status]}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!canApprove(user.role) && (
        <p className="mt-4 text-xs text-muted">
          결재 승인은 원장 및 관리자 계정에서만 처리할 수 있습니다.
        </p>
      )}
    </>
  );
}

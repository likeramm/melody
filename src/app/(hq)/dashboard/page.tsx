import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { requireStaff, canApprove } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, fmtRelative, todayRange, weekRange } from "@/lib/dates";
import {
  ADMISSION_STAGE_LABEL,
  ADMISSION_STAGE_ORDER,
  CONSULTATION_TYPE_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/labels";

export const metadata: Metadata = { title: "업무 대시보드" };

// 대시보드는 항상 최신 상태를 보여줘야 하므로 캐시하지 않습니다.
export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["TODO", "IN_PROGRESS", "NEED_APPROVAL"] as const;

export default async function DashboardPage() {
  const user = await requireStaff();

  // 원장·관리자는 전체 업무를, 그 외 담당자는 본인에게 할당된 업무만 봅니다.
  const seesAll = canApprove(user.role);
  const scope: Prisma.TaskWhereInput = seesAll ? {} : { assigneeId: user.id };
  const base: Prisma.TaskWhereInput = {
    ...scope,
    isTemplate: false,
    status: { in: [...OPEN_STATUSES] },
  };

  const [
    todayTasks,
    weekCount,
    urgentTasks,
    approvalTasks,
    overdueCount,
    pendingConsultations,
    followUps,
    pipeline,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { ...base, dueDate: todayRange() },
      include: { assignee: { select: { name: true } } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 12,
    }),
    prisma.task.count({ where: { ...base, dueDate: weekRange() } }),
    prisma.task.findMany({
      where: { ...base, priority: "URGENT" },
      include: { assignee: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: { ...scope, isTemplate: false, status: "NEED_APPROVAL" },
      include: { assignee: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.task.count({ where: { ...base, dueDate: { lt: todayRange().gte } } }),
    prisma.consultation.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "asc" },
      take: 6,
    }),
    prisma.consultation.count({
      where: { status: "COMPLETED", followUpAt: { lte: todayRange().lte } },
    }),
    prisma.student.groupBy({
      by: ["stage"],
      where: { isActive: true },
      _count: { _all: true },
    }),
  ]);

  const stageCount = Object.fromEntries(pipeline.map((p) => [p.stage, p._count._all]));

  return (
    <>
      <PageHeader
        title={`${user.name}님, 오늘의 업무입니다`}
        description={
          seesAll ? "학원 전체 업무를 기준으로 집계했습니다." : "나에게 할당된 업무만 표시됩니다."
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="오늘 마감"
          value={todayTasks.length}
          hint={overdueCount > 0 ? `지연 ${overdueCount}` : undefined}
          tone="danger"
        />
        <StatCard label="이번 주 업무" value={weekCount} />
        <StatCard
          label="긴급"
          value={urgentTasks.length}
          tone="danger"
          hint={urgentTasks.length > 0 ? "확인 필요" : undefined}
        />
        <StatCard
          label="결재 대기"
          value={approvalTasks.length}
          tone="warning"
          hint={canApprove(user.role) && approvalTasks.length > 0 ? "내 결재" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="오늘의 업무"
            action={
              <Link href="/tasks" className="text-sm font-medium text-brand-600 hover:underline">
                전체 보기
              </Link>
            }
          />
          {todayTasks.length === 0 ? (
            <EmptyState message="오늘 마감인 업무가 없습니다." hint="반복 업무는 매일 자동으로 생성됩니다." />
          ) : (
            <ul className="divide-y divide-border">
              {todayTasks.map((task) => (
                <li key={task.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</span>
                  {task.priority === "URGENT" && <Badge tone="danger">긴급</Badge>}
                  <Badge tone={task.status === "NEED_APPROVAL" ? "warning" : "neutral"}>
                    {TASK_STATUS_LABEL[task.status]}
                  </Badge>
                  <span className="w-16 shrink-0 truncate text-right text-xs text-muted">
                    {task.assignee?.name ?? "미배정"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="긴급 (Urgent)" />
          {urgentTasks.length === 0 ? (
            <EmptyState message="긴급 업무가 없습니다." />
          ) : (
            <ul className="space-y-2.5">
              {urgentTasks.map((task) => (
                <li key={task.id} className="rounded-lg bg-rose-50/60 px-3 py-2">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {task.assignee?.name ?? "미배정"} · 마감 {fmtRelative(task.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="결재 대기"
            description={canApprove(user.role) ? "승인 권한이 있습니다." : "원장 승인 대기 중입니다."}
          />
          {approvalTasks.length === 0 ? (
            <EmptyState message="결재 대기 항목이 없습니다." />
          ) : (
            <ul className="space-y-2.5">
              {approvalTasks.map((task) => (
                <li key={task.id} className="rounded-lg bg-amber-50/60 px-3 py-2">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    요청자 {task.assignee?.name ?? "—"} · {fmtRelative(task.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="신규 상담 신청"
            description={followUps > 0 ? `Follow-up 예정 ${followUps}건` : undefined}
            action={
              <Link
                href="/consultations"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                전체 보기
              </Link>
            }
          />
          {pendingConsultations.length === 0 ? (
            <EmptyState message="대기 중인 상담 신청이 없습니다." />
          ) : (
            <ul className="space-y-2.5">
              {pendingConsultations.map((c) => (
                <li key={c.id} className="rounded-lg bg-sky-50/60 px-3 py-2">
                  <p className="truncate text-sm font-medium">
                    {c.applicantStudentName}
                    {c.applicantGrade ? ` (${c.applicantGrade})` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {CONSULTATION_TYPE_LABEL[c.type]} · 희망 {fmtDateTime(c.preferredAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="입학 파이프라인"
            action={
              <Link href="/students" className="text-sm font-medium text-brand-600 hover:underline">
                보드 열기
              </Link>
            }
          />
          <ul className="space-y-2">
            {ADMISSION_STAGE_ORDER.filter((s) => s !== "WITHDRAWN").map((stage) => (
              <li key={stage} className="flex items-center justify-between text-sm">
                <span className="text-muted">{ADMISSION_STAGE_LABEL[stage]}</span>
                <span className="font-semibold tabular-nums">{stageCount[stage] ?? 0}명</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

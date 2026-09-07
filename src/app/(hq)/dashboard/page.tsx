import type { Metadata, Route } from "next";
import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, monthRange, todayRange, weekRange } from "@/lib/dates";
import {
  ATTENDANCE_STATUS_LABEL,
  CONTACT_TYPE_LABEL,
  MILESTONE_STATUS_LABEL,
  MILESTONE_TYPE_LABEL,
  OPEN_TASK_STATUSES,
  STUDENT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  VENDOR_EVENT_TYPE_LABEL,
  fmtWon,
} from "@/lib/labels";

export const metadata: Metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayRange();
  const week = weekRange();
  const month = monthRange();
  const openStatus = { in: [...OPEN_TASK_STATUSES] };

  const [
    p0Today,
    p1Week,
    overdue,
    followUps,
    todayConsults,
    todayAssessments,
    todaySessions,
    duePayments,
    unpaid,
    vendorsInProgress,
    monthMilestones,
  ] = await Promise.all([
    // 오늘의 P0 — 마감이 오늘이거나 기한이 없는 최우선 업무
    prisma.task.findMany({
      where: {
        status: openStatus,
        priority: "P0",
        OR: [{ dueDate: { lte: today.lte } }, { dueDate: null }],
      },
      include: { project: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
      take: 10,
    }),
    // 이번 주 P1
    prisma.task.findMany({
      where: { status: openStatus, priority: "P1", dueDate: week },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    // 기한 초과
    prisma.task.findMany({
      where: { status: openStatus, dueDate: { lt: today.gte } },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    // 오늘 연락해야 할 사람
    prisma.contactLog.findMany({
      where: {
        followUpNeeded: true,
        completedAt: null,
        nextContactAt: { lte: today.lte },
      },
      include: {
        student: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { nextContactAt: "asc" },
      take: 10,
    }),
    // 오늘 상담
    prisma.student.findMany({
      where: { consultedAt: today },
      select: { id: true, name: true, grade: true, status: true },
    }),
    // 오늘 입학시험
    prisma.assessment.findMany({
      where: { takenAt: today },
      include: { student: { select: { id: true, name: true, grade: true } } },
    }),
    // 오늘 수업
    prisma.classSession.findMany({
      where: { date: today },
      include: {
        classGroup: { select: { name: true, schedule: true } },
        _count: { select: { records: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    // 이번 주 결제 예정 (아직 결제되지 않은 것)
    prisma.payment.findMany({
      where: { paidAt: null, dueAt: week },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { dueAt: "asc" },
    }),
    // 미납 — 예정일이 지났는데 결제되지 않은 것
    prisma.payment.findMany({
      where: { paidAt: null, dueAt: { lt: today.gte } },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
    // 외주 진행중 — 이벤트가 있고 아직 완료 기록이 없는 업체
    prisma.vendor.findMany({
      where: {
        events: { some: {} },
        NOT: { events: { some: { type: "COMPLETE" } } },
      },
      include: {
        events: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    // 이번 달 Milestone
    prisma.milestone.findMany({
      where: {
        status: { not: "DONE" },
        OR: [{ dueDate: month }, { startAt: month }],
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ]);

  const unpaidTotal = unpaid.reduce((sum, p) => sum + p.amount, 0);
  const dueTotal = duePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title={`${user.name}님, 오늘 이것만 보시면 됩니다`}
        description={fmtDate(new Date())}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="오늘의 P0"
          value={p0Today.length}
          tone="danger"
          hint={p0Today.length > 0 ? "최우선" : undefined}
        />
        <StatCard
          label="기한 초과"
          value={overdue.length}
          tone="danger"
          hint={overdue.length > 0 ? "지연" : undefined}
        />
        <StatCard
          label="오늘 Follow-up"
          value={followUps.length}
          tone="warning"
          hint={followUps.length > 0 ? "연락 필요" : undefined}
        />
        <StatCard
          label="미납"
          value={unpaid.length}
          tone="danger"
          hint={unpaidTotal > 0 ? fmtWon(unpaidTotal) : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 오늘의 P0 */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="오늘의 P0"
            description="가장 먼저 해야 할 일입니다."
            action={
              <Link href="/tasks" className="text-sm font-medium text-brand-600 hover:underline">
                할 일 전체
              </Link>
            }
          />
          {p0Today.length === 0 ? (
            <EmptyState message="오늘 P0 업무가 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {p0Today.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <Badge tone="danger">P0</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                  {t.project && <Badge tone="brand">{t.project.name}</Badge>}
                  <Badge>{TASK_STATUS_LABEL[t.status]}</Badge>
                  <span className="w-20 shrink-0 text-right text-xs text-muted">
                    {t.dueDate ? fmtDate(t.dueDate) : "기한 없음"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 오늘 Follow-up */}
        <Card>
          <SectionTitle
            title="오늘 연락할 사람"
            action={
              <Link href="/followups" className="text-sm font-medium text-brand-600 hover:underline">
                전체
              </Link>
            }
          />
          {followUps.length === 0 ? (
            <EmptyState message="오늘 연락할 대상이 없습니다." />
          ) : (
            <ul className="space-y-2.5">
              {followUps.map((c) => {
                const who = c.student ?? c.vendor;
                // typedRoutes 는 템플릿 문자열을 추론하지 못해 단언이 필요합니다.
                const href = (
                  c.student
                    ? `/students/${c.student.id}`
                    : c.vendor
                      ? `/vendors/${c.vendor.id}`
                      : null
                ) as Route | null;
                const body = (
                  <>
                    <p className="truncate text-sm font-medium">
                      {who?.name ?? "대상 없음"}
                      <span className="ml-1.5 text-xs font-normal text-muted">
                        {c.student ? "학생" : c.vendor ? "업체" : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {CONTACT_TYPE_LABEL[c.type]} · {c.summary}
                    </p>
                  </>
                );
                return (
                  <li key={c.id} className="rounded-lg bg-amber-50/60 px-3 py-2">
                    {href ? <Link href={href}>{body}</Link> : body}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* 이번 주 P1 */}
        <Card>
          <SectionTitle title="이번 주 P1" />
          {p1Week.length === 0 ? (
            <EmptyState message="이번 주 P1 업무가 없습니다." />
          ) : (
            <ul className="space-y-2">
              {p1Week.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <span className="shrink-0 text-xs text-muted">{fmtDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 기한 초과 */}
        <Card>
          <SectionTitle title="기한 초과" />
          {overdue.length === 0 ? (
            <EmptyState message="지연된 업무가 없습니다." />
          ) : (
            <ul className="space-y-2">
              {overdue.map((t) => (
                <li key={t.id} className="rounded-lg bg-rose-50/60 px-3 py-2">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t.project?.name ?? "프로젝트 없음"} · {fmtDate(t.dueDate)} 마감
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 오늘 상담 / 입학시험 */}
        <Card>
          <SectionTitle title="오늘 상담 · 입학시험" />
          {todayConsults.length === 0 && todayAssessments.length === 0 ? (
            <EmptyState message="오늘 예정된 상담·시험이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {todayConsults.map((s) => (
                <li key={`c-${s.id}`} className="flex items-center gap-2 text-sm">
                  <Badge tone="info">상담</Badge>
                  <Link href={`/students/${s.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {s.name} {s.grade && `(${s.grade})`}
                  </Link>
                  <span className="shrink-0 text-xs text-muted">
                    {STUDENT_STATUS_LABEL[s.status]}
                  </span>
                </li>
              ))}
              {todayAssessments.map((a) => (
                <li key={`a-${a.id}`} className="flex items-center gap-2 text-sm">
                  <Badge tone="warning">시험</Badge>
                  <Link
                    href={`/students/${a.student.id}`}
                    className="min-w-0 flex-1 truncate hover:underline"
                  >
                    {a.student.name} {a.student.grade && `(${a.student.grade})`}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 오늘 수업 */}
        <Card>
          <SectionTitle
            title="오늘 수업"
            action={
              <Link href="/sessions" className="text-sm font-medium text-brand-600 hover:underline">
                수업 기록
              </Link>
            }
          />
          {todaySessions.length === 0 ? (
            <EmptyState message="오늘 등록된 수업이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {todaySessions.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="truncate text-sm font-medium">
                    {s.classGroup?.name ?? "반 미지정"}
                    {s.topic && <span className="font-normal text-muted"> · {s.topic}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {s.classGroup?.schedule ?? "시간 미정"} · 기록 {s._count.records}명
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 이번 주 결제 예정 */}
        <Card>
          <SectionTitle
            title="이번 주 결제 예정"
            description={dueTotal > 0 ? fmtWon(dueTotal) : undefined}
            action={
              <Link href="/finance" className="text-sm font-medium text-brand-600 hover:underline">
                회계
              </Link>
            }
          />
          {duePayments.length === 0 ? (
            <EmptyState message="이번 주 결제 예정이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {duePayments.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {p.student?.name ?? "—"} · {p.item}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{fmtWon(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 미납 */}
        <Card>
          <SectionTitle title="미납" description={unpaidTotal > 0 ? fmtWon(unpaidTotal) : undefined} />
          {unpaid.length === 0 ? (
            <EmptyState message="미납 건이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {unpaid.map((p) => (
                <li key={p.id} className="rounded-lg bg-rose-50/60 px-3 py-2">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {p.student?.name ?? "—"} · {p.item}
                    </span>
                    <span className="shrink-0 tabular-nums">{fmtWon(p.amount)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{fmtDate(p.dueAt)} 예정</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 외주 진행중 */}
        <Card>
          <SectionTitle
            title="외주 진행중"
            action={
              <Link href="/vendors" className="text-sm font-medium text-brand-600 hover:underline">
                업체
              </Link>
            }
          />
          {vendorsInProgress.length === 0 ? (
            <EmptyState message="진행중인 외주가 없습니다." />
          ) : (
            <ul className="space-y-2">
              {vendorsInProgress.map((v) => (
                <li key={v.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <Link href={`/vendors/${v.id}`} className="block">
                    <p className="truncate text-sm font-medium">{v.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {v.events[0]
                        ? `${fmtDate(v.events[0].date)} ${VENDOR_EVENT_TYPE_LABEL[v.events[0].type]} · ${v.events[0].description}`
                        : "진행 기록 없음"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 이번 달 Milestone */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="이번 달 Milestone"
            action={
              <Link href="/schedule" className="text-sm font-medium text-brand-600 hover:underline">
                학원 일정
              </Link>
            }
          />
          {monthMilestones.length === 0 ? (
            <EmptyState message="이번 달 일정이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {monthMilestones.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <Badge tone="brand">{MILESTONE_TYPE_LABEL[m.type]}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.title}</span>
                  <div className="flex w-24 shrink-0 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted">{m.progress}%</span>
                  </div>
                  <Badge>{MILESTONE_STATUS_LABEL[m.status]}</Badge>
                  <span className="w-20 shrink-0 text-right text-xs text-muted">
                    {fmtDate(m.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 오늘 수업의 출결 요약이 필요할 때를 위한 범례 */}
        <Card>
          <SectionTitle title="출결 표기" description="수업 기록에서 쓰는 색입니다." />
          <ul className="space-y-1.5 text-sm">
            {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={
                    s === "PRESENT"
                      ? "h-4 w-4 rounded bg-emerald-200"
                      : s === "LATE"
                        ? "h-4 w-4 rounded bg-amber-200"
                        : s === "EXCUSED"
                          ? "h-4 w-4 rounded bg-slate-300"
                          : "h-4 w-4 rounded bg-rose-300"
                  }
                />
                <span className="text-muted">{ATTENDANCE_STATUS_LABEL[s]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

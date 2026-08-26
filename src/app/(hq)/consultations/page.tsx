import type { Metadata } from "next";

import { Badge, Card, ComingSoon, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime, fmtRelative, todayRange } from "@/lib/dates";
import {
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_TYPE_LABEL,
  LIKELIHOOD_LABEL,
} from "@/lib/labels";

export const metadata: Metadata = { title: "상담 · 예약" };
export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PENDING: "warning",
  CONFIRMED: "info",
  COMPLETED: "success",
  NO_SHOW: "danger",
  CANCELLED: "neutral",
} as const;

export default async function ConsultationsPage() {
  await requireStaff();

  const [pending, upcoming, followUps, recent] = await Promise.all([
    prisma.consultation.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.consultation.findMany({
      where: { status: "CONFIRMED", scheduledAt: { gte: todayRange().gte } },
      orderBy: { scheduledAt: "asc" },
      take: 20,
      include: { counselor: { select: { name: true } } },
    }),
    prisma.consultation.findMany({
      where: { status: "COMPLETED", followUpAt: { not: null } },
      orderBy: { followUpAt: "asc" },
      take: 10,
    }),
    prisma.consultation.findMany({
      where: { status: "COMPLETED" },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      include: { student: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="상담 · 예약"
        description="홈페이지 상담 신청 폼(/apply)으로 접수된 건이 여기에 대기 상태로 쌓입니다."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="신규 접수 (대기)"
            description="예약 시간을 확정하면 Google Calendar 에 등록됩니다."
          />
          {pending.length === 0 ? (
            <EmptyState message="대기 중인 신청이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{c.applicantStudentName}</span>
                    {c.applicantGrade && <Badge>{c.applicantGrade}</Badge>}
                    <Badge tone="info">{CONSULTATION_TYPE_LABEL[c.type]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    학부모 {c.parentName} · {c.parentPhone}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    희망 {fmtDateTime(c.preferredAt)} · 접수 {fmtRelative(c.requestedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="예정된 상담" />
          {upcoming.length === 0 ? (
            <EmptyState message="확정된 상담 일정이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.applicantStudentName}
                  </span>
                  <span className="text-xs text-muted">{fmtDateTime(c.scheduledAt)}</span>
                  <Badge tone={c.googleEventId ? "success" : "neutral"}>
                    {c.googleEventId ? "캘린더 동기화됨" : "미동기화"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="Follow-up 예정" description="상담 후 재접촉이 필요한 건입니다." />
          {followUps.length === 0 ? (
            <EmptyState message="예정된 Follow-up 이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {followUps.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.applicantStudentName}
                  </span>
                  <Badge tone="brand">
                    입학 가능성 {LIKELIHOOD_LABEL[c.admissionLikelihood]}
                  </Badge>
                  <span className="text-xs text-muted">{fmtDate(c.followUpAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="최근 상담 기록" />
          {recent.length === 0 ? (
            <EmptyState message="완료된 상담이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {c.student?.name ?? c.applicantStudentName}
                    </span>
                    <Badge tone={STATUS_TONE[c.status]}>
                      {CONSULTATION_STATUS_LABEL[c.status]}
                    </Badge>
                    <span className="text-xs text-muted">{fmtDate(c.scheduledAt)}</span>
                  </div>
                  {c.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-700">{c.summary}</p>}
                  {c.recommendedProgram && (
                    <p className="mt-0.5 text-xs text-muted">추천 · {c.recommendedProgram}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <ComingSoon
          items={[
            "대기 건의 예약 시간 확정 → Google Calendar API 이벤트 생성 (Consultation.googleEventId 저장)",
            "캘린더에서 일정이 변경·삭제되면 웹훅으로 되받아 상태를 동기화 (2-way)",
            "상담 완료 처리 시 학생 레코드 자동 생성 및 파이프라인 단계 이동",
            "Follow-up 일정 도래 시 담당자에게 Task 자동 발행",
          ]}
        />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AssessmentChart, type ChartPoint } from "@/components/assessment-chart";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import {
  ADMISSION_STAGE_LABEL,
  ASSESSMENT_TYPE_LABEL,
  ATTENDANCE_STATUS_LABEL,
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_TYPE_LABEL,
  ENGLISH_LEVEL_LABEL,
  GUARDIAN_RELATION_LABEL,
  SKILL_AREAS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: student ? `${student.name} 학생` : "학생 상세" };
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      homeroomTeacher: { select: { name: true } },
      classGroup: { select: { name: true, schedule: true } },
      guardians: { orderBy: { isPrimary: "desc" } },
      // 차트는 시간순이어야 하므로 오름차순으로 가져옵니다.
      assessments: { orderBy: { takenAt: "asc" }, include: { assessor: { select: { name: true } } } },
      consultations: { orderBy: { requestedAt: "desc" }, take: 10 },
      notes: { orderBy: { createdAt: "desc" }, take: 10, include: { author: { select: { name: true } } } },
      attendances: { orderBy: { date: "desc" }, take: 30 },
    },
  });

  if (!student) notFound();

  const latest = student.assessments.at(-1);
  const chartData: ChartPoint[] = student.assessments.map((a) => ({
    label: fmtDate(a.takenAt).slice(2), // "26.03.14"
    reading: a.reading,
    listening: a.listening,
    speaking: a.speaking,
    writing: a.writing,
    grammar: a.grammar,
    vocabulary: a.vocabulary,
  }));

  const attended = student.attendances.filter((a) => a.status !== "ABSENT").length;
  const attendanceRate =
    student.attendances.length > 0
      ? Math.round((attended / student.attendances.length) * 100)
      : null;

  const openRequests = student.notes.filter((n) => n.isParentRequest && !n.resolvedAt);

  return (
    <>
      <Link href="/students" className="mb-3 inline-block text-sm text-muted hover:underline">
        ← 학생 목록
      </Link>

      <PageHeader
        title={student.name}
        description={[student.school, student.grade].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex gap-2">
            <Badge tone="brand">{ADMISSION_STAGE_LABEL[student.stage]}</Badge>
            {student.englishLevel && (
              <Badge>{ENGLISH_LEVEL_LABEL[student.englishLevel]}</Badge>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 360도 뷰 요약 */}
        <Card className="lg:col-span-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="담임 강사" value={student.homeroomTeacher?.name} />
            <Field label="수강반" value={student.classGroup?.name} />
            <Field label="수업 시간" value={student.classGroup?.schedule} />
            <Field label="등록일" value={fmtDate(student.enrolledAt)} />
            <Field
              label="최근 출석률"
              value={attendanceRate === null ? "—" : `${attendanceRate}%`}
            />
            <Field label="연락처" value={student.phone} />
          </dl>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-brand-50/60 p-3">
              <p className="text-xs font-medium text-brand-700">현재 학습 목표</p>
              <p className="mt-1 text-sm">{student.currentGoal ?? "설정되지 않았습니다."}</p>
            </div>
            <div className="rounded-lg bg-slate-100/70 p-3">
              <p className="text-xs font-medium text-slate-700">최신 진단 결과</p>
              <p className="mt-1 text-sm">
                {latest
                  ? `${fmtDate(latest.takenAt)} ${ASSESSMENT_TYPE_LABEL[latest.type]} · 총점 ${
                      latest.totalScore ?? "—"
                    }`
                  : "평가 기록이 없습니다."}
              </p>
            </div>
          </div>
        </Card>

        {/* 평가 추이 */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="영역별 성취도 추이"
            description="학부모 리포트에 그대로 사용할 수 있는 형태입니다."
          />
          {chartData.length === 0 ? (
            <EmptyState message="평가 데이터가 아직 없습니다." hint="첫 평가를 입력하면 그래프가 그려집니다." />
          ) : (
            <AssessmentChart data={chartData} />
          )}
        </Card>

        {/* 최신 회차 점수 */}
        <Card>
          <SectionTitle title="최신 회차 점수" />
          {!latest ? (
            <EmptyState message="평가 기록이 없습니다." />
          ) : (
            <>
              <ul className="space-y-2">
                {SKILL_AREAS.map((area) => {
                  const score = latest[area.key];
                  return (
                    <li key={area.key} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-xs text-muted">{area.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${score ?? 0}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">
                        {score ?? "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {latest.teacherComment && (
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {latest.teacherComment}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                {latest.parentSharedAt
                  ? `학부모 공개됨 · ${fmtDate(latest.parentSharedAt)}`
                  : "학부모에게 아직 공개되지 않았습니다."}
              </p>
            </>
          )}
        </Card>

        {/* 상담 이력 */}
        <Card className="lg:col-span-2">
          <SectionTitle title="상담 이력" />
          {student.consultations.length === 0 ? (
            <EmptyState message="상담 기록이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {student.consultations.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{CONSULTATION_TYPE_LABEL[c.type]}</Badge>
                    <Badge>{CONSULTATION_STATUS_LABEL[c.status]}</Badge>
                    <span className="text-xs text-muted">
                      {fmtDateTime(c.scheduledAt ?? c.requestedAt)}
                    </span>
                  </div>
                  {c.summary && <p className="mt-1.5 text-sm">{c.summary}</p>}
                  {c.followUpAt && (
                    <p className="mt-1 text-xs text-muted">
                      다음 Follow-up · {fmtDate(c.followUpAt)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 학부모 및 요청사항 */}
        <Card>
          <SectionTitle
            title="학부모"
            description={openRequests.length > 0 ? `미처리 요청 ${openRequests.length}건` : undefined}
          />
          <ul className="space-y-2.5">
            {student.guardians.map((g) => (
              <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium">
                  {g.name}
                  <span className="ml-1.5 text-xs font-normal text-muted">
                    {GUARDIAN_RELATION_LABEL[g.relation]}
                  </span>
                  {g.userId && (
                    <Badge tone="success" className="ml-2">
                      포털 계정
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">{g.phone ?? g.email ?? "연락처 미입력"}</p>
              </li>
            ))}
            {student.guardians.length === 0 && <EmptyState message="등록된 학부모가 없습니다." />}
          </ul>

          {student.notes.length > 0 && (
            <>
              <p className="mt-5 mb-2 text-sm font-semibold">요청사항 · 메모</p>
              <ul className="space-y-2">
                {student.notes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-sm">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.author?.name ?? "시스템"} · {fmtDate(n.createdAt)}
                      {n.isParentRequest && !n.resolvedAt && " · 미처리"}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* 출결 */}
        <Card className="lg:col-span-3">
          <SectionTitle title="최근 출결" description="최근 30회 수업 기준입니다." />
          {student.attendances.length === 0 ? (
            <EmptyState message="출결 기록이 없습니다." />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {student.attendances.map((a) => (
                <span
                  key={a.id}
                  title={`${fmtDate(a.date)} ${ATTENDANCE_STATUS_LABEL[a.status]}`}
                  className={
                    a.status === "PRESENT"
                      ? "h-7 w-7 rounded bg-emerald-100"
                      : a.status === "LATE"
                        ? "h-7 w-7 rounded bg-amber-100"
                        : a.status === "EXCUSED"
                          ? "h-7 w-7 rounded bg-slate-200"
                          : "h-7 w-7 rounded bg-rose-200"
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { ScoreChart, type ChartPoint } from "@/components/score-chart";
import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, toDateInput } from "@/lib/dates";
import {
  ASSESSMENT_AREAS,
  ASSESSMENT_DECISION_LABEL,
  ATTENDANCE_STATUS_LABEL,
  CONTACT_TYPE_LABEL,
  GUARDIAN_RELATION_LABEL,
  SKILL_AREAS,
  STUDENT_STATUS_LABEL,
  fmtWon,
} from "@/lib/labels";

import { StudentEditForm } from "../edit-form";
import { NewAssessmentForm, NewGuardianForm, NewPortfolioForm } from "../student-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await prisma.student.findUnique({ where: { id }, select: { name: true } });
  return { title: s ? s.name : "학생" };
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [student, classGroups] = await Promise.all([
    prisma.student.findUnique({
    where: { id },
    include: {
      classGroup: { select: { name: true, schedule: true } },
      guardians: { orderBy: { isPrimary: "desc" } },
      assessments: { orderBy: { takenAt: "asc" } },
      portfolios: { orderBy: { producedAt: "desc" } },
      monthlyReviews: { orderBy: { yearMonth: "desc" }, take: 12 },
      contactLogs: { orderBy: { contactedAt: "desc" }, take: 20 },
      payments: { orderBy: [{ paidAt: "desc" }, { dueAt: "desc" }], take: 20 },
      // 수업 기록은 한 번 입력하면 여기에 그대로 누적됩니다.
      sessionRecords: {
        orderBy: { session: { date: "asc" } },
        include: {
          session: {
            select: { id: true, date: true, topic: true, content: true, homework: true },
          },
        },
      },
      },
    }),
    prisma.classGroup.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!student) notFound();

  const records = student.sessionRecords;
  const attended = records.filter((r) => r.attendance !== "ABSENT").length;
  const attendanceRate = records.length ? Math.round((attended / records.length) * 100) : null;

  const homeworkGiven = records.filter((r) => r.homeworkSubmitted !== null);
  const homeworkRate = homeworkGiven.length
    ? Math.round(
        (homeworkGiven.filter((r) => r.homeworkSubmitted).length / homeworkGiven.length) * 100,
      )
    : null;

  // 수업 기록에서 영역 평가 추이를 만듭니다.
  const skillPoints: ChartPoint[] = records
    .filter((r) => SKILL_AREAS.some((a) => r[a.key] !== null))
    .map((r) => ({
      label: fmtDate(r.session.date).slice(5),
      reading: r.reading,
      writing: r.writing,
      speaking: r.speaking,
      debate: r.debate,
    }));

  // Quiz / Test 점수 추이
  const scorePoints: ChartPoint[] = records
    .filter((r) => r.quizScore !== null || r.testScore !== null)
    .map((r) => ({
      label: fmtDate(r.session.date).slice(5),
      quizScore: r.quizScore,
      testScore: r.testScore,
    }));

  const latestAssessment = student.assessments.at(-1);
  const unpaidTotal = student.payments
    .filter((p) => !p.paidAt)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <Link href="/students" className="mb-3 inline-block text-sm text-muted hover:underline">
        ← 학생 · 상담자 목록
      </Link>

      <PageHeader
        title={student.name}
        description={[student.school, student.grade].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="brand">{STUDENT_STATUS_LABEL[student.status]}</Badge>
            <StudentEditForm
              classGroups={classGroups}
              student={{
                id: student.id,
                name: student.name,
                school: student.school,
                grade: student.grade,
                phone: student.phone,
                status: student.status,
                source: student.source,
                firstInquiryAt: toDateInput(student.firstInquiryAt),
                consultedAt: toDateInput(student.consultedAt),
                assessedAt: toDateInput(student.assessedAt),
                enrolledAt: toDateInput(student.enrolledAt),
                nextContactAt: toDateInput(student.nextContactAt),
                consultationNote: student.consultationNote,
                assessmentResult: student.assessmentResult,
                level: student.level,
                evaluation: student.evaluation,
                recommendedClass: student.recommendedClass,
                notEnrolledReason: student.notEnrolledReason,
                nextGoal: student.nextGoal,
                memo: student.memo,
                classGroupId: student.classGroupId,
              }}
            />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="출석률" value={attendanceRate === null ? "—" : `${attendanceRate}%`} />
        <StatCard label="과제 수행률" value={homeworkRate === null ? "—" : `${homeworkRate}%`} />
        <StatCard label="수업 기록" value={`${records.length}회`} />
        <StatCard
          label="미납"
          value={fmtWon(unpaidTotal)}
          tone={unpaidTotal > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 기본 정보 */}
        <Card className="lg:col-span-3">
          <SectionTitle title="기본 정보" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="연락처" value={student.phone} />
            <Field label="어디서 알게 됐는지" value={student.source} />
            <Field label="최초 문의일" value={fmtDate(student.firstInquiryAt)} />
            <Field label="상담일" value={fmtDate(student.consultedAt)} />
            <Field label="입학시험 · 인터뷰일" value={fmtDate(student.assessedAt)} />
            <Field label="등록일" value={fmtDate(student.enrolledAt)} />
            <Field label="레벨" value={student.level} />
            <Field label="평가" value={student.evaluation} />
            <Field label="추천반" value={student.recommendedClass} />
            <Field label="수강반" value={student.classGroup?.name} />
            <Field label="수업 시간" value={student.classGroup?.schedule} />
            <Field label="추후 연락일" value={fmtDate(student.nextContactAt)} />
          </dl>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {student.consultationNote && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">상담 내용</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{student.consultationNote}</p>
              </div>
            )}
            {student.assessmentResult && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">시험 결과</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{student.assessmentResult}</p>
              </div>
            )}
            {student.nextGoal && (
              <div className="rounded-lg bg-brand-50/60 p-3">
                <p className="text-xs font-medium text-brand-700">다음 목표</p>
                <p className="mt-1 text-sm">{student.nextGoal}</p>
              </div>
            )}
            {student.notEnrolledReason && (
              <div className="rounded-lg bg-rose-50/60 p-3">
                <p className="text-xs font-medium text-rose-700">미등록 사유</p>
                <p className="mt-1 text-sm">{student.notEnrolledReason}</p>
              </div>
            )}
          </div>
        </Card>

        {/* 영역별 평가 추이 */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="영역별 평가 추이"
            description="수업 기록에 입력한 평가가 자동으로 쌓입니다."
          />
          {skillPoints.length === 0 ? (
            <EmptyState message="아직 영역 평가 기록이 없습니다." hint="수업 기록에서 입력하면 그래프가 그려집니다." />
          ) : (
            <ScoreChart data={skillPoints} series={[...SKILL_AREAS]} />
          )}
        </Card>

        {/* Quiz / Test */}
        <Card>
          <SectionTitle title="Quiz · Test 점수" />
          {scorePoints.length === 0 ? (
            <EmptyState message="점수 기록이 없습니다." />
          ) : (
            <ScoreChart
              data={scorePoints}
              series={[
                { key: "quizScore", label: "Quiz" },
                { key: "testScore", label: "Test" },
              ]}
              height={240}
            />
          )}
        </Card>

        {/* 수업 기록 누적 */}
        <Card className="lg:col-span-3" padded={false}>
          <div className="p-4 sm:p-5">
            <SectionTitle
              title="수업 기록"
              description="수업 회차에 입력한 내용이 여기에 그대로 누적됩니다."
              action={
                <Link href="/sessions" className="text-sm font-medium text-brand-600 hover:underline">
                  수업 기록 입력
                </Link>
              }
            />
          </div>
          {records.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState message="수업 기록이 없습니다." />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-y border-border text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">수업일</th>
                    <th className="px-4 py-2.5 font-medium">주제</th>
                    <th className="px-4 py-2.5 font-medium">출결</th>
                    <th className="px-4 py-2.5 font-medium">과제</th>
                    <th className="px-4 py-2.5 font-medium">Quiz</th>
                    <th className="px-4 py-2.5 font-medium">Test</th>
                    <th className="px-4 py-2.5 font-medium">R/W/S/D</th>
                    <th className="px-4 py-2.5 font-medium">강사 코멘트</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...records].reverse().map((r) => (
                    <tr key={r.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(r.session.date)}</td>
                      <td className="px-4 py-2.5">{r.session.topic ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge
                          tone={
                            r.attendance === "PRESENT"
                              ? "success"
                              : r.attendance === "ABSENT"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {ATTENDANCE_STATUS_LABEL[r.attendance]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {r.homeworkSubmitted === null ? "—" : r.homeworkSubmitted ? "제출" : "미제출"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-muted">{r.quizScore ?? "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums text-muted">{r.testScore ?? "—"}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-muted">
                        {[r.reading, r.writing, r.speaking, r.debate]
                          .map((v) => v ?? "—")
                          .join(" / ")}
                      </td>
                      <td className="max-w-64 px-4 py-2.5 text-muted">{r.teacherComment ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 입학시험 / 인터뷰 */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="입학시험 · 인터뷰"
            description={
              latestAssessment
                ? `최근 ${fmtDate(latestAssessment.takenAt)} · 총점 ${latestAssessment.totalScore ?? "—"}`
                : undefined
            }
          />
          {student.assessments.length === 0 ? (
            <EmptyState message="시험 기록이 없습니다." />
          ) : (
            <ul className="mb-4 divide-y divide-border">
              {[...student.assessments].reverse().map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{fmtDate(a.takenAt)}</span>
                    {a.decision && (
                      <Badge
                        tone={
                          a.decision === "PASS"
                            ? "success"
                            : a.decision === "CONDITIONAL"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {ASSESSMENT_DECISION_LABEL[a.decision]}
                      </Badge>
                    )}
                    {a.totalScore !== null && <Badge>총점 {a.totalScore}</Badge>}
                    {a.deliveredAt && (
                      <span className="text-xs text-muted">결과 전달 {fmtDate(a.deliveredAt)}</span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {ASSESSMENT_AREAS.map((area) => (
                      <span key={area.key}>
                        {area.label} <span className="tabular-nums">{a[area.key] ?? "—"}</span>
                      </span>
                    ))}
                  </div>

                  {a.resultSummary && <p className="mt-2 text-sm">{a.resultSummary}</p>}
                  {a.interviewNote && (
                    <p className="mt-1 text-sm text-muted">인터뷰 · {a.interviewNote}</p>
                  )}
                  {a.recommendation && (
                    <p className="mt-1 text-sm text-muted">추천 · {a.recommendation}</p>
                  )}
                  {a.reportUrl && (
                    <a
                      href={a.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      <ExternalLink size={11} aria-hidden />
                      진단보고서
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <NewAssessmentForm studentId={student.id} />
        </Card>

        {/* 보호자 */}
        <Card>
          <SectionTitle title="보호자" />
          {student.guardians.length === 0 ? (
            <EmptyState message="등록된 보호자가 없습니다." />
          ) : (
            <ul className="mb-3 space-y-2">
              {student.guardians.map((g) => (
                <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium">
                    {g.name}
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      {GUARDIAN_RELATION_LABEL[g.relation]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{g.phone ?? g.email ?? "연락처 없음"}</p>
                </li>
              ))}
            </ul>
          )}
          <NewGuardianForm studentId={student.id} />
        </Card>

        {/* 연락 / 상담 기록 */}
        <Card>
          <SectionTitle
            title="연락 · 상담 기록"
            action={
              <Link href="/followups" className="text-sm font-medium text-brand-600 hover:underline">
                Follow-up
              </Link>
            }
          />
          {student.contactLogs.length === 0 ? (
            <EmptyState message="연락 기록이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {student.contactLogs.map((c) => (
                <li key={c.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Badge>{CONTACT_TYPE_LABEL[c.type]}</Badge>
                    {fmtDate(c.contactedAt)}
                    {c.followUpNeeded && !c.completedAt && (
                      <Badge tone="warning">다음 {fmtDate(c.nextContactAt)}</Badge>
                    )}
                  </p>
                  <p className="mt-1 text-sm">{c.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Portfolio */}
        <Card>
          <SectionTitle title="Portfolio 결과물" />
          {student.portfolios.length === 0 ? (
            <EmptyState message="등록된 결과물이 없습니다." />
          ) : (
            <ul className="mb-3 space-y-2">
              {student.portfolios.map((p) => (
                <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    {fmtDate(p.producedAt)}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                      >
                        <ExternalLink size={11} aria-hidden />
                        열기
                      </a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <NewPortfolioForm studentId={student.id} />
        </Card>

        {/* 결제 이력 */}
        <Card>
          <SectionTitle
            title="결제 이력"
            action={
              <Link href="/finance" className="text-sm font-medium text-brand-600 hover:underline">
                회계
              </Link>
            }
          />
          {student.payments.length === 0 ? (
            <EmptyState message="결제 기록이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {student.payments.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{p.item}</span>
                  <span className="shrink-0 tabular-nums">{fmtWon(p.amount)}</span>
                  <Badge tone={p.paidAt ? "success" : "danger"}>
                    {p.paidAt ? fmtDate(p.paidAt) : "미납"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 월별 성장 기록 */}
        <Card className="lg:col-span-3">
          <SectionTitle
            title="월별 성장 기록"
            description="출석률·과제 수행률·주요 코멘트를 월 단위로 남깁니다."
          />
          {student.monthlyReviews.length === 0 ? (
            <EmptyState
              message="월별 기록이 없습니다."
              hint="수업 기록이 한 달 이상 쌓이면 요약을 만들 수 있습니다."
            />
          ) : (
            <div className="table-scroll">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border text-left text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">월</th>
                    <th className="px-3 py-2 font-medium">출석률</th>
                    <th className="px-3 py-2 font-medium">과제 수행률</th>
                    <th className="px-3 py-2 font-medium">주요 코멘트</th>
                    <th className="px-3 py-2 font-medium">Milestone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {student.monthlyReviews.map((m) => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{m.yearMonth}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">
                        {m.attendanceRate === null ? "—" : `${m.attendanceRate}%`}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted">
                        {m.homeworkRate === null ? "—" : `${m.homeworkRate}%`}
                      </td>
                      <td className="px-3 py-2 text-muted">{m.summary ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{m.milestone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

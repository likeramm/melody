import type { Metadata } from "next";

import { AssessmentChart, type ChartPoint } from "@/components/assessment-chart";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { ASSESSMENT_TYPE_LABEL, CONSULTATION_TYPE_LABEL, ENGLISH_LEVEL_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "학부모 포털" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await requireUser();

  // 접근 가능한 학생은 오직 Guardian 으로 연결된 자녀뿐입니다.
  const guardianships = await prisma.guardian.findMany({
    where: { userId: user.id },
    include: {
      student: {
        include: {
          classGroup: { select: { name: true, schedule: true } },
          homeroomTeacher: { select: { name: true } },
          // 학부모에게는 공개 처리된 평가만 보여줍니다.
          assessments: {
            where: { parentSharedAt: { not: null } },
            orderBy: { takenAt: "asc" },
          },
          consultations: {
            where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
            orderBy: { scheduledAt: "desc" },
            take: 5,
          },
          attendances: { orderBy: { date: "desc" }, take: 20 },
        },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold tracking-tight text-brand-700">MELODY</p>
          <p className="mt-0.5 text-sm text-muted">{user.name} 학부모님, 안녕하세요.</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </form>
      </header>

      {guardianships.length === 0 ? (
        <Card>
          <EmptyState
            message="연결된 학생 정보가 없습니다."
            hint="학원으로 문의해 주시면 계정을 연결해 드립니다."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {guardianships.map(({ id, student }) => {
            const latest = student.assessments.at(-1);
            const chartData: ChartPoint[] = student.assessments.map((a) => ({
              label: fmtDate(a.takenAt).slice(2),
              reading: a.reading,
              listening: a.listening,
              speaking: a.speaking,
              writing: a.writing,
              grammar: a.grammar,
              vocabulary: a.vocabulary,
            }));

            const present = student.attendances.filter((a) => a.status !== "ABSENT").length;
            const rate =
              student.attendances.length > 0
                ? Math.round((present / student.attendances.length) * 100)
                : null;

            return (
              <section key={id} className="space-y-4">
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">{student.name}</h2>
                      <p className="mt-0.5 text-sm text-muted">
                        {[student.school, student.grade].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    {student.englishLevel && (
                      <Badge tone="brand">{ENGLISH_LEVEL_LABEL[student.englishLevel]}</Badge>
                    )}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-muted">수강반</dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {student.classGroup?.name ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">수업 시간</dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {student.classGroup?.schedule ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">담임 강사</dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {student.homeroomTeacher?.name ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">최근 출석률</dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {rate === null ? "—" : `${rate}%`}
                      </dd>
                    </div>
                  </dl>

                  {student.currentGoal && (
                    <div className="mt-4 rounded-lg bg-brand-50/60 p-3">
                      <p className="text-xs font-medium text-brand-700">현재 학습 목표</p>
                      <p className="mt-1 text-sm">{student.currentGoal}</p>
                    </div>
                  )}
                </Card>

                <Card>
                  <SectionTitle
                    title="영역별 성취도"
                    description={
                      latest
                        ? `최근 평가 · ${fmtDate(latest.takenAt)} ${ASSESSMENT_TYPE_LABEL[latest.type]}`
                        : undefined
                    }
                  />
                  {chartData.length === 0 ? (
                    <EmptyState message="아직 공개된 평가 결과가 없습니다." />
                  ) : (
                    <>
                      <AssessmentChart data={chartData} />
                      {latest?.teacherComment && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-medium text-slate-600">강사 코멘트</p>
                          <p className="mt-1 text-sm text-slate-700">{latest.teacherComment}</p>
                        </div>
                      )}
                    </>
                  )}
                </Card>

                {student.consultations.length > 0 && (
                  <Card>
                    <SectionTitle title="상담 일정" />
                    <ul className="divide-y divide-border">
                      {student.consultations.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-2 py-2.5">
                          <Badge tone="info">{CONSULTATION_TYPE_LABEL[c.type]}</Badge>
                          <span className="text-sm">{fmtDateTime(c.scheduledAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

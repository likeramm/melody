import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";

import { addStudentToSession } from "../actions";
import { RecordTable, type RecordRow } from "../record-table";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await prisma.classSession.findUnique({
    where: { id },
    select: { date: true, topic: true },
  });
  return { title: s ? `${fmtDate(s.date)} 수업` : "수업" };
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const session = await prisma.classSession.findUnique({
    where: { id },
    include: {
      classGroup: { select: { id: true, name: true, schedule: true } },
      lesson: { select: { topic: true, curriculum: { select: { title: true } } } },
      teacher: { select: { name: true } },
      records: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!session) notFound();

  // 아직 이 수업에 들어 있지 않은 학생 (반을 옮겼거나 새로 등록한 경우)
  const existingIds = session.records.map((r) => r.studentId);
  const candidates = await prisma.student.findMany({
    where: {
      id: { notIn: existingIds.length ? existingIds : ["-"] },
      status: { in: ["ENROLLED", "ON_LEAVE"] },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  const rows: RecordRow[] = session.records.map((r) => ({
    id: r.id,
    studentName: r.student.name,
    attendance: r.attendance,
    homeworkSubmitted: r.homeworkSubmitted,
    quizScore: r.quizScore,
    testScore: r.testScore,
    reading: r.reading,
    writing: r.writing,
    speaking: r.speaking,
    debate: r.debate,
    teacherComment: r.teacherComment,
  }));

  return (
    <>
      <Link href="/sessions" className="mb-3 inline-block text-sm text-muted hover:underline">
        ← 수업 기록
      </Link>

      <PageHeader
        title={`${fmtDate(session.date)} 수업`}
        description={session.topic ?? undefined}
        action={session.classGroup ? <Badge tone="brand">{session.classGroup.name}</Badge> : null}
      />

      <div className="grid gap-4">
        <Card>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">반</dt>
              <dd className="mt-0.5 text-sm font-medium">{session.classGroup?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">레슨 플랜</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {session.lesson ? `${session.lesson.curriculum.title} · ${session.lesson.topic}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">숙제</dt>
              <dd className="mt-0.5 text-sm font-medium">{session.homework ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">작성자</dt>
              <dd className="mt-0.5 text-sm font-medium">{session.teacher?.name ?? "—"}</dd>
            </div>
          </dl>
          {session.content && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-600">수업 내용</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{session.content}</p>
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="p-4 sm:p-5">
            <SectionTitle
              title="학생별 기록"
              description="저장하면 각 학생의 progress 에 그대로 누적됩니다."
              action={
                candidates.length > 0 ? (
                  <form action={addStudentToSession} className="flex items-center gap-2">
                    <input type="hidden" name="sessionId" value={session.id} />
                    <select
                      name="studentId"
                      className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        학생 추가
                      </option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      추가
                    </button>
                  </form>
                ) : null
              }
            />
          </div>

          {rows.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState
                message="이 수업에 학생이 없습니다."
                hint="위에서 학생을 추가하거나, 수업을 만들 때 반을 지정하세요."
              />
            </div>
          ) : (
            <div className="px-4 pb-5 sm:px-5">
              <RecordTable sessionId={session.id} rows={rows} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

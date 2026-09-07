import type { Metadata } from "next";
import { ExternalLink, Trash2 } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";

import { copyCurriculum, deleteCurriculum, deleteLesson } from "./actions";
import { NewCurriculumForm, NewLessonForm, NewSemesterForm } from "./curriculum-forms";

export const metadata: Metadata = { title: "커리큘럼" };
export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  await requireUser();

  const semesters = await prisma.semester.findMany({
    include: {
      curriculums: {
        include: {
          lessons: { orderBy: [{ week: "asc" }, { sortOrder: "asc" }] },
          classGroups: { select: { name: true } },
        },
        orderBy: { title: "asc" },
      },
    },
    orderBy: { name: "desc" },
  });

  const semesterOptions = semesters.map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <PageHeader
        title="커리큘럼"
        description="학기 → 커리큘럼 → 개별 수업 순서로 관리합니다. 다음 학기에는 통째로 복제해 고쳐 쓸 수 있습니다."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {semesters.map((s) => (
          <span
            key={s.id}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-slate-600"
          >
            {s.name}
            <span className="ml-1.5 text-xs text-muted">{s.curriculums.length}</span>
          </span>
        ))}
        <NewSemesterForm />
      </div>

      {semesters.length === 0 ? (
        <Card>
          <EmptyState
            message="학기가 없습니다."
            hint="먼저 학기를 만들고 커리큘럼을 추가하세요."
          />
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <NewCurriculumForm semesters={semesterOptions} />
          </div>

          <div className="space-y-6">
            {semesters.map((sem) => (
              <section key={sem.id}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {sem.name}
                  {sem.startDate && (
                    <span className="text-xs font-normal text-muted">
                      {fmtDate(sem.startDate)} ~ {fmtDate(sem.endDate)}
                    </span>
                  )}
                </h2>

                {sem.curriculums.length === 0 ? (
                  <Card>
                    <EmptyState message="이 학기에 커리큘럼이 없습니다." />
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {sem.curriculums.map((c) => (
                      <Card key={c.id} padded={false}>
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
                          <div className="min-w-0">
                            <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                              {c.title}
                              {c.level && <Badge tone="brand">{c.level}</Badge>}
                            </h3>
                            <p className="mt-0.5 text-sm text-muted">
                              전 {c.lessons.length}개 수업
                              {c.classGroups.length > 0 &&
                                ` · 적용반 ${c.classGroups.map((g) => g.name).join(", ")}`}
                            </p>
                            {c.description && (
                              <p className="mt-1 text-sm text-muted">{c.description}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* 다음 학기로 복제 */}
                            <form action={copyCurriculum} className="flex items-center gap-1.5">
                              <input type="hidden" name="sourceId" value={c.id} />
                              <select
                                name="semesterId"
                                defaultValue=""
                                className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs"
                              >
                                <option value="" disabled>
                                  복제할 학기
                                </option>
                                {semesterOptions.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                복제
                              </button>
                            </form>

                            <form action={deleteCurriculum}>
                              <input type="hidden" name="id" value={c.id} />
                              <button
                                type="submit"
                                aria-label="커리큘럼 삭제"
                                className="rounded p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={15} aria-hidden />
                              </button>
                            </form>
                          </div>
                        </div>

                        {c.lessons.length === 0 ? (
                          <div className="p-5">
                            <EmptyState message="등록된 수업이 없습니다." />
                          </div>
                        ) : (
                          <div className="table-scroll">
                            <table className="w-full min-w-[1100px] text-sm">
                              <thead className="border-b border-border text-left text-xs text-muted">
                                <tr>
                                  <th className="px-4 py-2.5 font-medium">주차</th>
                                  <th className="px-4 py-2.5 font-medium">주제</th>
                                  <th className="px-4 py-2.5 font-medium">Learning Objective</th>
                                  <th className="px-4 py-2.5 font-medium">Reading</th>
                                  <th className="px-4 py-2.5 font-medium">Discussion</th>
                                  <th className="px-4 py-2.5 font-medium">Writing</th>
                                  <th className="px-4 py-2.5 font-medium">Assignments</th>
                                  <th className="px-4 py-2.5 font-medium">자료</th>
                                  <th className="px-4 py-2.5 font-medium">사용일 · 수정</th>
                                  <th className="px-4 py-2.5" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {c.lessons.map((l) => (
                                  <tr key={l.id} className="align-top hover:bg-slate-50/60">
                                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                                      {l.week ? `${l.week}주차` : "—"}
                                    </td>
                                    <td className="max-w-48 px-4 py-2.5 font-medium">{l.topic}</td>
                                    <td className="max-w-56 px-4 py-2.5 text-muted">
                                      {l.learningObjective ?? "—"}
                                    </td>
                                    <td className="max-w-48 px-4 py-2.5 text-muted">
                                      {l.reading ?? "—"}
                                    </td>
                                    <td className="max-w-48 px-4 py-2.5 text-muted">
                                      {l.discussionQuestions ?? "—"}
                                    </td>
                                    <td className="max-w-48 px-4 py-2.5 text-muted">
                                      {l.writing ?? "—"}
                                    </td>
                                    <td className="max-w-48 px-4 py-2.5 text-muted">
                                      {l.assignments ?? "—"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex flex-col gap-1">
                                        {l.lecturePptUrl && (
                                          <a
                                            href={l.lecturePptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                                          >
                                            <ExternalLink size={11} aria-hidden />
                                            PPT
                                          </a>
                                        )}
                                        {l.worksheetUrl && (
                                          <a
                                            href={l.worksheetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                                          >
                                            <ExternalLink size={11} aria-hidden />
                                            Worksheet
                                          </a>
                                        )}
                                        {!l.lecturePptUrl && !l.worksheetUrl && (
                                          <span className="text-xs text-muted">—</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted">
                                      {l.usedAt ? fmtDate(l.usedAt) : "미사용"}
                                      {l.revisionNote && (
                                        <p className="mt-0.5">{l.revisionNote}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <form action={deleteLesson}>
                                        <input type="hidden" name="id" value={l.id} />
                                        <button
                                          type="submit"
                                          aria-label="수업 삭제"
                                          className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                          <Trash2 size={14} aria-hidden />
                                        </button>
                                      </form>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div className="p-4 sm:p-5">
                          <NewLessonForm curriculumId={c.id} />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}

import type { Metadata } from "next";

import { Badge, Card, ComingSoon, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ENGLISH_LEVEL_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "커리큘럼" };
export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  await requireStaff();

  const curriculums = await prisma.curriculum.findMany({
    where: { isActive: true },
    include: {
      lessons: { orderBy: { week: "asc" } },
      classGroups: { select: { name: true } },
    },
    orderBy: [{ semester: "desc" }, { title: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="커리큘럼"
        description="학기·주차별 레슨 플랜을 규격화해 저장합니다. 수업 자료 제작의 기준 데이터입니다."
      />

      {curriculums.length === 0 ? (
        <Card>
          <EmptyState
            message="등록된 커리큘럼이 없습니다."
            hint="npm run db:seed 로 샘플 커리큘럼을 넣어볼 수 있습니다."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {curriculums.map((c) => (
            <Card key={c.id} padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-semibold">{c.title}</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {c.semester} · 전 {c.lessons.length}주차
                    {c.classGroups.length > 0 &&
                      ` · 적용반 ${c.classGroups.map((g) => g.name).join(", ")}`}
                  </p>
                </div>
                {c.level && <Badge tone="brand">{ENGLISH_LEVEL_LABEL[c.level]}</Badge>}
              </div>

              {c.lessons.length === 0 ? (
                <div className="p-5">
                  <EmptyState message="등록된 주차가 없습니다." />
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="border-b border-border text-left text-xs text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">주차</th>
                        <th className="px-4 py-3 font-medium">주제 (Topic)</th>
                        <th className="px-4 py-3 font-medium">학습 목표</th>
                        <th className="px-4 py-3 font-medium">필수 어휘</th>
                        <th className="px-4 py-3 font-medium">과제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.lessons.map((l) => (
                        <tr key={l.id} className="align-top hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{l.week}주차</td>
                          <td className="px-4 py-3 font-medium">{l.topic}</td>
                          <td className="max-w-64 px-4 py-3 text-muted">{l.objectives ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {l.vocabulary.slice(0, 5).map((v) => (
                                <span
                                  key={v}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                                >
                                  {v}
                                </span>
                              ))}
                              {l.vocabulary.length > 5 && (
                                <span className="text-xs text-muted">
                                  +{l.vocabulary.length - 5}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="max-w-48 px-4 py-3 text-muted">{l.homework ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ComingSoon
          items={[
            "레슨 플랜 생성·수정 폼 및 학기 단위 복제 기능",
            "수업 자료 파일 업로드 (Vercel Blob 연동)",
            "주차 데이터를 AI 프롬프트 라이브러리에 바로 주입해 워크시트 생성",
          ]}
        />
      </div>
    </>
  );
}

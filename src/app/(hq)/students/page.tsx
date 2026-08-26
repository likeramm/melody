import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMISSION_STAGE_LABEL, ADMISSION_STAGE_ORDER, ENGLISH_LEVEL_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "학생 관리" };
export const dynamic = "force-dynamic";

const STAGE_TONE = {
  INQUIRY: "neutral",
  CONSULTATION: "info",
  ASSESSMENT_COMPLETED: "warning",
  REGISTERED: "success",
  WITHDRAWN: "danger",
} as const;

export default async function StudentsPage() {
  await requireStaff();

  const students = await prisma.student.findMany({
    where: { isActive: true },
    include: {
      homeroomTeacher: { select: { name: true } },
      guardians: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: [{ stage: "asc" }, { stageOrder: "asc" }, { createdAt: "desc" }],
  });

  const byStage = ADMISSION_STAGE_ORDER.map((stage) => ({
    stage,
    items: students.filter((s) => s.stage === stage),
  }));

  return (
    <>
      <PageHeader
        title="학생 관리"
        description="입학 파이프라인 단계별 현황입니다. 카드를 눌러 학생 상세로 이동합니다."
      />

      {/* 모바일에서는 컬럼을 가로 스크롤로, 데스크톱에서는 5열 그리드로 배치합니다. */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {byStage.map(({ stage, items }) => (
          <section
            key={stage}
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-auto lg:shrink"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{ADMISSION_STAGE_LABEL[stage]}</h2>
              <span className="text-xs text-muted tabular-nums">{items.length}</span>
            </div>

            <div className="min-h-24 space-y-2 rounded-xl bg-slate-100/70 p-2">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted">비어 있음</p>
              ) : (
                items.map((s) => (
                  <Link
                    key={s.id}
                    href={`/students/${s.id}`}
                    className="block rounded-lg border border-border bg-card p-3 transition hover:border-brand-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <Badge tone={STAGE_TONE[s.stage]}>{s.grade ?? "—"}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{s.school ?? "학교 미입력"}</p>
                    <p className="mt-1.5 flex flex-wrap gap-1 text-xs text-muted">
                      {s.englishLevel && (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">
                          {ENGLISH_LEVEL_LABEL[s.englishLevel]}
                        </span>
                      )}
                      {s.homeroomTeacher && <span>담임 {s.homeroomTeacher.name}</span>}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <Card className="mt-6">
        <p className="text-sm font-medium">드래그 앤 드롭 단계 이동</p>
        <p className="mt-1 text-sm text-muted">
          현재는 읽기 전용 보드입니다. 카드를 끌어 단계를 바꾸는 기능은 다음 단계에서
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">Student.stageOrder</code>
          를 사용해 붙입니다.
        </p>
      </Card>
    </>
  );
}

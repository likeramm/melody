import type { Metadata } from "next";
import type { PromptCategory } from "@prisma/client";

import { Badge, Card, ComingSoon, EmptyState, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROMPT_CATEGORY_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "AI 프롬프트" };
export const dynamic = "force-dynamic";

const CATEGORY_TONE: Record<PromptCategory, "brand" | "info" | "warning" | "success" | "neutral"> =
  {
    WORKSHEET: "brand",
    DISCUSSION: "info",
    MARKETING: "warning",
    ASSESSMENT: "success",
    PARENT_REPORT: "info",
    ETC: "neutral",
  };

export default async function PromptsPage() {
  await requireStaff();

  const prompts = await prisma.promptTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { useCount: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="AI 프롬프트 라이브러리"
        description="수업 주제를 넣으면 워크시트·토론 질문·마케팅 카피를 뽑을 수 있는 MELODY 전용 프롬프트 모음입니다."
      />

      {prompts.length === 0 ? (
        <Card>
          <EmptyState
            message="등록된 프롬프트가 없습니다."
            hint="npm run db:seed 로 기본 프롬프트 세트를 넣을 수 있습니다."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prompts.map((p) => (
            <Card key={p.id}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{p.title}</h2>
                <Badge tone={CATEGORY_TONE[p.category]}>
                  {PROMPT_CATEGORY_LABEL[p.category]}
                </Badge>
              </div>

              {p.description && <p className="mb-3 text-sm text-muted">{p.description}</p>}

              <pre className="max-h-52 overflow-auto rounded-lg bg-slate-50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
                {p.body}
              </pre>

              {p.variables.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.variables.map((v) => (
                    <code
                      key={v}
                      className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700"
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs text-muted">사용 {p.useCount}회</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ComingSoon
          items={[
            "변수 입력 폼 → 치환된 최종 프롬프트 복사 버튼",
            "커리큘럼 주차를 선택하면 topic·vocabulary 가 자동으로 채워지는 연동",
            "Claude API 직접 호출로 결과물까지 플랫폼 안에서 생성",
            "프롬프트 등록·수정 및 팀 공유",
          ]}
        />
      </div>
    </>
  );
}

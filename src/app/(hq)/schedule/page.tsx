import type { Metadata } from "next";
import type { MilestoneStatus } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, monthRange, todayRange } from "@/lib/dates";
import { MILESTONE_STATUS_LABEL, MILESTONE_TYPE_LABEL } from "@/lib/labels";

import { deleteMilestone, updateMilestoneProgress } from "./actions";
import { NewMilestoneForm } from "./milestone-form";

export const metadata: Metadata = { title: "학원 일정" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<MilestoneStatus, "neutral" | "info" | "success"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "info",
  DONE: "success",
  ON_HOLD: "neutral",
};

const STATUS_KEYS = ["PLANNED", "IN_PROGRESS", "DONE", "ON_HOLD"] as const;

export default async function SchedulePage() {
  await requireUser();
  const today = todayRange();
  const month = monthRange();

  const [milestones, projects, thisMonthCount, overdueCount] = await Promise.all([
    prisma.milestone.findMany({
      include: { project: { select: { name: true } }, owner: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.project.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.milestone.count({ where: { status: { not: "DONE" }, dueDate: month } }),
    prisma.milestone.count({ where: { status: { not: "DONE" }, dueDate: { lt: today.gte } } }),
  ]);

  const done = milestones.filter((m) => m.status === "DONE").length;

  return (
    <>
      <PageHeader
        title="학원 일정"
        description="개강·모집·특강·광고·공사 등 학원 전체 일정을 Milestone 으로 관리합니다."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체 일정" value={milestones.length} />
        <StatCard label="이번 달" value={thisMonthCount} tone="brand" />
        <StatCard
          label="기한 초과"
          value={overdueCount}
          tone="danger"
          hint={overdueCount > 0 ? "확인 필요" : undefined}
        />
        <StatCard label="완료" value={done} tone="success" />
      </div>

      <div className="mb-4">
        <NewMilestoneForm projects={projects} />
      </div>

      {milestones.length === 0 ? (
        <Card>
          <EmptyState message="등록된 일정이 없습니다." />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="p-4 sm:p-5">
            <SectionTitle title="전체 일정" description="마감일 순으로 정렬됩니다." />
          </div>
          <div className="table-scroll">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-y border-border text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">종류</th>
                  <th className="px-4 py-2.5 font-medium">일정</th>
                  <th className="px-4 py-2.5 font-medium">프로젝트</th>
                  <th className="px-4 py-2.5 font-medium">기간</th>
                  <th className="px-4 py-2.5 font-medium">담당</th>
                  <th className="px-4 py-2.5 font-medium">상태 · 완료율</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {milestones.map((m) => {
                  const isOverdue =
                    m.status !== "DONE" && m.dueDate !== null && m.dueDate < today.gte;
                  return (
                    <tr key={m.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge tone="brand">{MILESTONE_TYPE_LABEL[m.type]}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{m.title}</p>
                        {m.goal && <p className="text-xs text-muted">{m.goal}</p>}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                        {m.project?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                        {m.startAt ? `${fmtDate(m.startAt)} ~ ` : ""}
                        <span className={isOverdue ? "font-medium text-rose-600" : ""}>
                          {fmtDate(m.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                        {m.owner?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <form
                          action={updateMilestoneProgress}
                          className="flex flex-wrap items-center gap-1.5"
                        >
                          <input type="hidden" name="id" value={m.id} />
                          <select
                            name="status"
                            defaultValue={m.status}
                            className="rounded border border-border bg-white px-1.5 py-1 text-xs"
                          >
                            {STATUS_KEYS.map((s) => (
                              <option key={s} value={s}>
                                {MILESTONE_STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                          <input
                            name="progress"
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={m.progress}
                            className="w-16 rounded border border-border bg-white px-1.5 py-1 text-xs tabular-nums"
                          />
                          <button
                            type="submit"
                            className="rounded border border-border px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            저장
                          </button>
                          <Badge tone={STATUS_TONE[m.status]}>{m.progress}%</Badge>
                        </form>
                      </td>
                      <td className="px-4 py-2.5">
                        <form action={deleteMilestone}>
                          <input type="hidden" name="id" value={m.id} />
                          <button
                            type="submit"
                            aria-label="삭제"
                            className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

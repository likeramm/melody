import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";

import { deleteSession } from "./actions";
import { NewClassGroupForm, NewSessionForm } from "./session-forms";

export const metadata: Metadata = { title: "수업 기록" };
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  await requireUser();

  const [sessions, classGroups, lessons] = await Promise.all([
    prisma.classSession.findMany({
      include: {
        classGroup: { select: { name: true } },
        _count: { select: { records: true } },
        records: { select: { attendance: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.classGroup.findMany({
      where: { isActive: true },
      select: { id: true, name: true, schedule: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.lesson.findMany({
      include: { curriculum: { select: { title: true } } },
      orderBy: [{ curriculumId: "asc" }, { sortOrder: "asc" }],
      take: 200,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="수업 기록"
        description="수업 한 번을 만들고 학생별 출결·과제·점수를 표에서 한 번에 입력합니다. 입력하면 학생 페이지에 자동으로 쌓입니다."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {classGroups.map((c) => (
          <span
            key={c.id}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-slate-600"
          >
            {c.name}
            <span className="ml-1.5 text-xs text-muted">{c._count.students}명</span>
          </span>
        ))}
        <NewClassGroupForm />
      </div>

      <div className="mb-4">
        <NewSessionForm
          classGroups={classGroups.map((c) => ({ id: c.id, name: c.name }))}
          lessons={lessons.map((l) => ({
            id: l.id,
            label: `${l.curriculum.title} · ${l.week ? `${l.week}주차 ` : ""}${l.topic}`,
          }))}
        />
      </div>

      {sessions.length === 0 ? (
        <Card>
          <EmptyState message="등록된 수업이 없습니다." hint="반을 만들고 수업 회차를 추가하세요." />
        </Card>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const present = s.records.filter((r) => r.attendance !== "ABSENT").length;
            return (
              <li key={s.id}>
                <Card padded={false} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/sessions/${s.id}`} className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{fmtDate(s.date)}</span>
                        {s.classGroup && <Badge tone="brand">{s.classGroup.name}</Badge>}
                        <span className="min-w-0 truncate text-sm">{s.topic ?? "주제 미입력"}</span>
                      </p>
                      {s.homework && (
                        <p className="mt-0.5 truncate text-xs text-muted">숙제 · {s.homework}</p>
                      )}
                    </Link>
                    <span className="shrink-0 text-xs text-muted">
                      출석 {present}/{s._count.records}
                    </span>
                    <form action={deleteSession} className="shrink-0">
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton label="삭제" />
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

import type { Metadata, Route } from "next";
import type { StudentStatus } from "@prisma/client";
import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";
import { STUDENT_STATUS_LABEL, STUDENT_STATUS_ORDER } from "@/lib/labels";

import { changeStudentStatus } from "./actions";
import { NewStudentForm } from "./student-forms";

export const metadata: Metadata = { title: "학생 · 상담자" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<StudentStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  NEW_INQUIRY: "neutral",
  CONSULT_BOOKED: "info",
  ASSESSED: "warning",
  ENROLLMENT_REVIEW: "warning",
  ENROLLED: "success",
  ON_LEAVE: "neutral",
  WITHDRAWN: "danger",
  NOT_ENROLLED: "danger",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireUser();
  const { q, status } = await searchParams;

  const [students, classGroups, counts] = await Promise.all([
    prisma.student.findMany({
      where: {
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
        ...(status && STUDENT_STATUS_ORDER.includes(status as StudentStatus)
          ? { status: status as StudentStatus }
          : {}),
      },
      include: {
        guardians: { where: { isPrimary: true }, take: 1 },
        classGroup: { select: { name: true } },
        _count: { select: { assessments: true, sessionRecords: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 300,
    }),
    prisma.classGroup.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <>
      <PageHeader
        title="학생 · 상담자"
        description="문의만 하고 등록하지 않은 상담자도 지우지 않고 남깁니다."
      />

      {/* 상태 필터 */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          href="/students"
          className={
            !status
              ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white"
              : "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          }
        >
          전체 <span className="ml-1 opacity-70">{total}</span>
        </Link>
        {STUDENT_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/students?status=${s}` as Route}
            className={
              status === s
                ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            }
          >
            {STUDENT_STATUS_LABEL[s]}
            <span className="ml-1 opacity-70">{countByStatus[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* 이름 검색 */}
      <form className="mb-4 flex gap-2" action="/students">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름으로 검색"
          className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          검색
        </button>
      </form>

      <div className="mb-4">
        <NewStudentForm classGroups={classGroups} />
      </div>

      {students.length === 0 ? (
        <Card>
          <EmptyState message="조건에 맞는 학생·상담자가 없습니다." />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="table-scroll">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">학교 · 학년</th>
                  <th className="px-4 py-3 font-medium">보호자</th>
                  <th className="px-4 py-3 font-medium">유입</th>
                  <th className="px-4 py-3 font-medium">최초 문의</th>
                  <th className="px-4 py-3 font-medium">기록</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/students/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                      {s.classGroup && (
                        <p className="text-xs text-muted">{s.classGroup.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {[s.school, s.grade].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {s.guardians[0]
                        ? `${s.guardians[0].name}${s.guardians[0].phone ? ` · ${s.guardians[0].phone}` : ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{s.source ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {fmtDate(s.firstInquiryAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                      시험 {s._count.assessments} · 수업 {s._count.sessionRecords}
                    </td>
                    <td className="px-4 py-3">
                      {/* 드롭다운을 바꾸면 바로 상태가 저장됩니다. 기존 기록은 유지됩니다. */}
                      <form action={changeStudentStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <Badge tone={STATUS_TONE[s.status]}>{STUDENT_STATUS_LABEL[s.status]}</Badge>
                        <select
                          name="status"
                          defaultValue={s.status}
                          className="rounded border border-border bg-white px-1.5 py-1 text-xs"
                        >
                          {STUDENT_STATUS_ORDER.map((st) => (
                            <option key={st} value={st}>
                              {STUDENT_STATUS_LABEL[st]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded border border-border px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          변경
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

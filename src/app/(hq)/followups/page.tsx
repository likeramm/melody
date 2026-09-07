import type { Metadata, Route } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, todayRange } from "@/lib/dates";
import { CONTACT_TYPE_LABEL } from "@/lib/labels";

import { completeFollowUp, deleteContactLog } from "./actions";
import { NewContactLogForm } from "./followup-form";

export const metadata: Metadata = { title: "Follow-up" };
export const dynamic = "force-dynamic";

type LogTarget = {
  student: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
};

function nameOf(c: LogTarget) {
  return c.student?.name ?? c.vendor?.name ?? "대상 없음";
}

// typedRoutes 는 템플릿 문자열을 추론하지 못해 단언이 필요합니다.
function hrefOf(c: LogTarget): Route | null {
  if (c.student) return `/students/${c.student.id}` as Route;
  if (c.vendor) return `/vendors/${c.vendor.id}` as Route;
  return null;
}

export default async function FollowUpsPage() {
  await requireUser();
  const today = todayRange();
  const include = {
    student: { select: { id: true, name: true } },
    vendor: { select: { id: true, name: true } },
  };

  const [due, upcoming, recent, students, vendors] = await Promise.all([
    // 예정일이 지났거나 오늘인 것
    prisma.contactLog.findMany({
      where: { followUpNeeded: true, completedAt: null, nextContactAt: { lte: today.lte } },
      include,
      orderBy: { nextContactAt: "asc" },
    }),
    prisma.contactLog.findMany({
      where: { followUpNeeded: true, completedAt: null, nextContactAt: { gt: today.lte } },
      include,
      orderBy: { nextContactAt: "asc" },
      take: 30,
    }),
    prisma.contactLog.findMany({ include, orderBy: { contactedAt: "desc" }, take: 40 }),
    prisma.student.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.vendor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  const targets = [
    ...students.map((s) => ({ value: `student:${s.id}`, label: `학생 · ${s.name}` })),
    ...vendors.map((v) => ({ value: `vendor:${v.id}`, label: `업체 · ${v.name}` })),
  ];

  return (
    <>
      <PageHeader
        title="Follow-up"
        description="학생·학부모·업체 연락을 한 곳에 남기고 다음 연락 예정일을 관리합니다."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="오늘까지 연락"
          value={due.length}
          tone="danger"
          hint={due.length > 0 ? "지금" : undefined}
        />
        <StatCard label="예정" value={upcoming.length} />
        <StatCard label="최근 기록" value={recent.length} />
        <StatCard label="연락 대상" value={targets.length} />
      </div>

      <div className="mb-4">
        <NewContactLogForm targets={targets} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="오늘 연락할 사람" description="예정일이 지났거나 오늘인 건입니다." />
          {due.length === 0 ? (
            <EmptyState message="오늘 연락할 대상이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {due.map((c) => {
                const href = hrefOf(c);
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {href ? (
                          <Link href={href} className="hover:underline">
                            {nameOf(c)}
                          </Link>
                        ) : (
                          nameOf(c)
                        )}
                        <Badge tone={c.student ? "info" : "brand"}>
                          {c.student ? "학생" : "업체"}
                        </Badge>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {CONTACT_TYPE_LABEL[c.type]} · {c.summary}
                      </p>
                      <p className="mt-0.5 text-xs text-rose-600">
                        예정 {fmtDate(c.nextContactAt)}
                      </p>
                    </div>
                    <form action={completeFollowUp}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        완료
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="예정된 Follow-up" />
          {upcoming.length === 0 ? (
            <EmptyState message="예정된 연락이 없습니다." />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{nameOf(c)}</span>
                  <span className="shrink-0 text-xs text-muted">{fmtDate(c.nextContactAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2" padded={false}>
          <div className="p-4 sm:p-5">
            <SectionTitle title="전체 연락 기록" description="마지막 연락일 기준 최신순입니다." />
          </div>
          {recent.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState message="연락 기록이 없습니다." />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-y border-border text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">연락일</th>
                    <th className="px-4 py-2.5 font-medium">대상</th>
                    <th className="px-4 py-2.5 font-medium">방법</th>
                    <th className="px-4 py-2.5 font-medium">내용</th>
                    <th className="px-4 py-2.5 font-medium">다음 예정</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((c) => (
                    <tr key={c.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(c.contactedAt)}</td>
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{nameOf(c)}</td>
                      <td className="px-4 py-2.5 text-muted">{CONTACT_TYPE_LABEL[c.type]}</td>
                      <td className="max-w-72 px-4 py-2.5 text-muted">{c.summary}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                        {c.completedAt ? (
                          <Badge tone="success">처리됨</Badge>
                        ) : (
                          fmtDate(c.nextContactAt)
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <form action={deleteContactLog}>
                          <input type="hidden" name="id" value={c.id} />
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

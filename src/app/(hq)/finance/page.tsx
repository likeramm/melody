import type { Metadata, Route } from "next";
import type { ExpenseCategory } from "@prisma/client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, monthRange } from "@/lib/dates";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  PAYMENT_METHOD_LABEL,
  REVENUE_TYPE_LABEL,
  fmtWon,
} from "@/lib/labels";

import { deleteExpense, deletePayment, markPaid, refundPayment } from "./actions";
import { NewExpenseForm, NewPaymentForm } from "./finance-forms";

export const metadata: Metadata = { title: "회계" };
export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireUser();
  const { month: monthParam } = await searchParams;

  // ?month=2026-09 형태. 없으면 이번 달.
  const base = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date();
  const range = monthRange(base);
  const label = `${base.getFullYear()}년 ${base.getMonth() + 1}월`;

  const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const [payments, expenses, byCategory, students, vendors, projects, unpaid] = await Promise.all([
    prisma.payment.findMany({
      where: { OR: [{ paidAt: range }, { paidAt: null, dueAt: range }] },
      include: { student: { select: { id: true, name: true } } },
      orderBy: [{ paidAt: "desc" }, { dueAt: "desc" }],
    }),
    prisma.expense.findMany({
      where: { spentAt: range },
      include: {
        vendor: { select: { id: true, name: true } },
        project: { select: { name: true } },
      },
      orderBy: { spentAt: "desc" },
    }),
    // 카테고리별 비용 자동 합산
    prisma.expense.groupBy({
      by: ["category"],
      where: { spentAt: range },
      _sum: { amount: true },
    }),
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
    prisma.project.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.payment.findMany({ where: { paidAt: null }, select: { amount: true } }),
  ]);

  // 환불 건은 매출에서 뺍니다.
  const revenue = payments
    .filter((p) => p.paidAt && !p.isRefunded)
    .reduce((sum, p) => sum + p.amount, 0);
  const spend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const unpaidTotal = unpaid.reduce((sum, p) => sum + p.amount, 0);
  const categoryTotals = Object.fromEntries(
    byCategory.map((c) => [c.category, c._sum.amount ?? 0]),
  ) as Record<ExpenseCategory, number>;

  return (
    <>
      <PageHeader
        title="회계"
        description="내부 관리용 수입·지출 기록입니다. 세무 신고용은 아닙니다."
      />

      {/* 월 이동 */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/finance?month=${key(prev)}` as Route}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← 이전 달
        </Link>
        <span className="px-2 text-sm font-semibold">{label}</span>
        <Link
          href={`/finance?month=${key(next)}` as Route}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          다음 달 →
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="총 매출" value={fmtWon(revenue)} tone="success" />
        <StatCard label="총 지출" value={fmtWon(spend)} tone="danger" />
        <StatCard
          label="차액"
          value={fmtWon(revenue - spend)}
          tone={revenue - spend >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="미납 (전체)"
          value={fmtWon(unpaidTotal)}
          tone={unpaidTotal > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* 카테고리별 비용 자동 합산 */}
      <Card className="mb-4">
        <SectionTitle title="카테고리별 지출" description={`${label} 기준`} />
        {spend === 0 ? (
          <EmptyState message="이 달의 지출 기록이 없습니다." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EXPENSE_CATEGORY_ORDER.filter((c) => (categoryTotals[c] ?? 0) > 0).map((c) => {
              const amount = categoryTotals[c] ?? 0;
              const pct = Math.round((amount / spend) * 100);
              return (
                <li key={c} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="flex items-center justify-between text-sm">
                    <span className="text-muted">{EXPENSE_CATEGORY_LABEL[c]}</span>
                    <span className="font-medium tabular-nums">{fmtWon(amount)}</span>
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <NewPaymentForm students={students} />
        <NewExpenseForm vendors={vendors} projects={projects} />
      </div>

      <div className="grid gap-4">
        {/* 수입 */}
        <Card padded={false}>
          <div className="p-4 sm:p-5">
            <SectionTitle title="수입" description="미납은 실제 결제일이 비어 있는 건입니다." />
          </div>
          {payments.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState message="이 달의 수입 기록이 없습니다." />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-y border-border text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">학생</th>
                    <th className="px-4 py-2.5 font-medium">항목</th>
                    <th className="px-4 py-2.5 font-medium">구분</th>
                    <th className="px-4 py-2.5 font-medium">금액</th>
                    <th className="px-4 py-2.5 font-medium">결제수단</th>
                    <th className="px-4 py-2.5 font-medium">예정 / 결제</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {p.student ? (
                          <Link
                            href={`/students/${p.student.id}`}
                            className="font-medium hover:underline"
                          >
                            {p.student.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5">{p.item}</td>
                      <td className="px-4 py-2.5 text-muted">
                        {REVENUE_TYPE_LABEL[p.revenueType]}
                      </td>
                      <td className="px-4 py-2.5 font-medium tabular-nums whitespace-nowrap">
                        {fmtWon(p.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{PAYMENT_METHOD_LABEL[p.method]}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {p.isRefunded ? (
                          <Badge tone="neutral">환불 {fmtDate(p.refundedAt)}</Badge>
                        ) : p.paidAt ? (
                          <Badge tone="success">{fmtDate(p.paidAt)}</Badge>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Badge tone="danger">미납</Badge>
                            <span className="text-xs text-muted">{fmtDate(p.dueAt)} 예정</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {!p.paidAt && !p.isRefunded && (
                            <form action={markPaid}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className="rounded border border-border px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                결제완료
                              </button>
                            </form>
                          )}
                          {p.paidAt && !p.isRefunded && (
                            <form action={refundPayment}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className="rounded border border-border px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                환불
                              </button>
                            </form>
                          )}
                          <form action={deletePayment}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmButton label="삭제" />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 지출 */}
        <Card padded={false}>
          <div className="p-4 sm:p-5">
            <SectionTitle title="지출" />
          </div>
          {expenses.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState message="이 달의 지출 기록이 없습니다." />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-y border-border text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">날짜</th>
                    <th className="px-4 py-2.5 font-medium">업체</th>
                    <th className="px-4 py-2.5 font-medium">항목</th>
                    <th className="px-4 py-2.5 font-medium">카테고리</th>
                    <th className="px-4 py-2.5 font-medium">프로젝트</th>
                    <th className="px-4 py-2.5 font-medium">금액</th>
                    <th className="px-4 py-2.5 font-medium">증빙</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(e.spentAt)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {e.vendor ? (
                          <Link
                            href={`/vendors/${e.vendor.id}`}
                            className="font-medium hover:underline"
                          >
                            {e.vendor.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5">{e.item}</td>
                      <td className="px-4 py-2.5">
                        <Badge>{EXPENSE_CATEGORY_LABEL[e.category]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{e.project?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 font-medium tabular-nums whitespace-nowrap">
                        {fmtWon(e.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {e.hasTaxInvoice && <Badge tone="success">세금계산서</Badge>}
                          {e.receiptUrl && (
                            <a
                              href={e.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                            >
                              <ExternalLink size={11} aria-hidden />
                              영수증
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <form action={deleteExpense}>
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmButton label="삭제" />
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";
import {
  CONTACT_TYPE_LABEL,
  EXPENSE_CATEGORY_LABEL,
  VENDOR_EVENT_TYPE_LABEL,
  fmtWon,
} from "@/lib/labels";

import { deleteVendorEvent } from "../actions";
import { NewVendorEventForm } from "../vendor-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const v = await prisma.vendor.findUnique({ where: { id }, select: { name: true } });
  return { title: v ? v.name : "업체" };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [vendor, projects] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id },
      include: {
        // 시간순으로 보여줘야 진행 흐름이 읽힙니다.
        events: {
          orderBy: { date: "asc" },
          include: { project: { select: { name: true } } },
        },
        expenses: { orderBy: { spentAt: "desc" } },
        contactLogs: { orderBy: { contactedAt: "desc" }, take: 10 },
      },
    }),
    prisma.project.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!vendor) notFound();

  const spend = vendor.expenses.reduce((s, e) => s + e.amount, 0);
  const done = vendor.events.some((e) => e.type === "COMPLETE");

  return (
    <>
      <Link href="/vendors" className="mb-3 inline-block text-sm text-muted hover:underline">
        ← 외주업체
      </Link>

      <PageHeader
        title={vendor.name}
        description={[vendor.field, vendor.contactName].filter(Boolean).join(" · ") || undefined}
        action={
          vendor.events.length > 0 ? (
            <Badge tone={done ? "success" : "warning"}>{done ? "완료" : "진행중"}</Badge>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <SectionTitle title="업체 정보" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Row label="전화" value={vendor.phone} />
            <Row label="이메일" value={vendor.email} />
            <Row label="카카오톡" value={vendor.kakaoId} />
            <Row label="최초 연락일" value={fmtDate(vendor.firstContactAt)} />
            <Row label="계약일" value={fmtDate(vendor.contractAt)} />
            <Row label="작업일" value={fmtDate(vendor.workAt)} />
            <Row label="결제일" value={fmtDate(vendor.paidAt)} />
            <Row label="견적" value={fmtWon(vendor.quoteAmount)} />
            <Row label="최종 금액" value={fmtWon(vendor.finalAmount)} />
            <Row label="지출 합계" value={fmtWon(spend)} />
            <Row
              label="만족도"
              value={vendor.satisfaction ? `${"★".repeat(vendor.satisfaction)}` : null}
            />
            <Row
              label="다시 쓸 업체"
              value={
                vendor.wouldReuse === null ? null : vendor.wouldReuse ? (
                  <Badge tone="success">예</Badge>
                ) : (
                  <Badge tone="danger">아니오</Badge>
                )
              }
            />
          </dl>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {vendor.workDescription && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">작업 내용</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{vendor.workDescription}</p>
              </div>
            )}
            {vendor.revisionRequest && (
              <div className="rounded-lg bg-amber-50/60 p-3">
                <p className="text-xs font-medium text-amber-800">수정 요청</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{vendor.revisionRequest}</p>
              </div>
            )}
          </div>

          {vendor.resultUrl && (
            <a
              href={vendor.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              <ExternalLink size={13} aria-hidden />
              결과물 보기
            </a>
          )}
        </Card>

        {/* 진행 timeline */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="진행 기록"
            description="의뢰부터 결제·완료까지 시간순으로 쌓입니다."
          />
          {vendor.events.length === 0 ? (
            <EmptyState message="진행 기록이 없습니다." />
          ) : (
            <ol className="mb-4 space-y-0">
              {vendor.events.map((e, i) => (
                <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* 세로 연결선 */}
                  {i < vendor.events.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-6 bottom-0 left-[7px] w-px bg-border"
                    />
                  )}
                  <span
                    aria-hidden
                    className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-brand-500 bg-card"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted">{fmtDate(e.date)}</span>
                      <Badge tone="brand">{VENDOR_EVENT_TYPE_LABEL[e.type]}</Badge>
                      {e.amount !== null && (
                        <span className="text-xs font-medium tabular-nums">{fmtWon(e.amount)}</span>
                      )}
                      {e.project && <Badge>{e.project.name}</Badge>}
                    </p>
                    <p className="mt-0.5 text-sm">{e.description}</p>
                  </div>
                  <form action={deleteVendorEvent} className="shrink-0">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <button
                      type="submit"
                      aria-label="삭제"
                      className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          )}
          <NewVendorEventForm vendorId={vendor.id} projects={projects} />
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="연결된 지출" />
            {vendor.expenses.length === 0 ? (
              <EmptyState message="지출 기록이 없습니다." />
            ) : (
              <ul className="space-y-2">
                {vendor.expenses.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{e.item}</span>
                    <Badge>{EXPENSE_CATEGORY_LABEL[e.category]}</Badge>
                    <span className="shrink-0 tabular-nums">{fmtWon(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle title="연락 기록" />
            {vendor.contactLogs.length === 0 ? (
              <EmptyState message="연락 기록이 없습니다." />
            ) : (
              <ul className="space-y-2">
                {vendor.contactLogs.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border px-3 py-2">
                    <p className="flex items-center gap-2 text-xs text-muted">
                      <Badge>{CONTACT_TYPE_LABEL[c.type]}</Badge>
                      {fmtDate(c.contactedAt)}
                    </p>
                    <p className="mt-1 text-sm">{c.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

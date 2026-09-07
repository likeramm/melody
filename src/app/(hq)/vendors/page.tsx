import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/dates";
import { VENDOR_EVENT_TYPE_LABEL, fmtWon } from "@/lib/labels";

import { NewVendorForm } from "./vendor-forms";

export const metadata: Metadata = { title: "외주업체" };
export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  await requireUser();

  const vendors = await prisma.vendor.findMany({
    include: {
      events: { orderBy: { date: "desc" }, take: 1 },
      _count: { select: { events: true } },
      expenses: { select: { amount: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const inProgress = vendors.filter(
    (v) => v._count.events > 0 && !v.events.some((e) => e.type === "COMPLETE"),
  );
  const totalSpend = vendors.reduce(
    (sum, v) => sum + v.expenses.reduce((s, e) => s + e.amount, 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="외주업체"
        description="언제 누구에게 뭘 요청했고, 얼마였고, 어디까지 진행됐는지 시간순으로 남깁니다."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체 업체" value={vendors.length} />
        <StatCard
          label="진행중"
          value={inProgress.length}
          tone="warning"
          hint={inProgress.length > 0 ? "완료 기록 없음" : undefined}
        />
        <StatCard label="누적 외주비" value={fmtWon(totalSpend)} />
        <StatCard
          label="재사용 추천"
          value={vendors.filter((v) => v.wouldReuse === true).length}
          tone="success"
        />
      </div>

      <div className="mb-4">
        <NewVendorForm />
      </div>

      {vendors.length === 0 ? (
        <Card>
          <EmptyState message="등록된 업체가 없습니다." />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {vendors.map((v) => {
            const spend = v.expenses.reduce((s, e) => s + e.amount, 0);
            const last = v.events[0];
            const done = v.events.some((e) => e.type === "COMPLETE");
            return (
              <Link key={v.id} href={`/vendors/${v.id}`}>
                <Card className="h-full transition hover:border-brand-300 hover:shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{v.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {[v.field, v.contactName].filter(Boolean).join(" · ") || "정보 없음"}
                      </p>
                    </div>
                    {v._count.events > 0 && (
                      <Badge tone={done ? "success" : "warning"}>
                        {done ? "완료" : "진행중"}
                      </Badge>
                    )}
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted">견적</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{fmtWon(v.quoteAmount)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">최종</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{fmtWon(v.finalAmount)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">지출 합계</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{fmtWon(spend)}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 truncate text-xs text-muted">
                    {last
                      ? `${fmtDate(last.date)} ${VENDOR_EVENT_TYPE_LABEL[last.type]} · ${last.description}`
                      : "진행 기록 없음"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        // 월넛 톤 그림자 — 아이보리 바탕 위에서 종이처럼 살짝 떠 보이게
        "rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(61,43,31,0.05),0_1px_1px_rgba(61,43,31,0.03)]",
        // 그리드 안에서도 안쪽 표가 카드를 밀어내지 않고 표만 가로 스크롤되게 합니다.
        "min-w-0",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-[15.5px] font-semibold tracking-tight text-slate-800">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-[22px] font-semibold tracking-tight text-brand-800 sm:text-[26px]">
          {title}
        </h1>
        {/* 로고 워드마크 아래의 골드 장식을 페이지 제목에도 씁니다. */}
        <div aria-hidden className="ornament-left mt-2">
          <span />
        </div>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

type Tone = "neutral" | "brand" | "gold" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
  /** 있으면 카드 전체가 해당 목록으로 가는 링크가 됩니다. */
  href?: Route;
}) {
  const card = (
    <Card
      className={cn(
        "relative h-full min-w-0 overflow-hidden",
        href && "transition group-hover:border-gold-400/70 group-hover:shadow-md",
      )}
    >
      {/* 카드 윗변의 가는 골드 선 — 요약 숫자 카드임을 표시합니다 */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-gold-400/0 via-gold-400/70 to-gold-400/0"
      />
      <p className="truncate text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-2">
        <span className="font-serif text-2xl font-semibold text-brand-800 tabular-nums sm:text-[28px]">
          {value}
        </span>
        {hint && <Badge tone={tone}>{hint}</Badge>}
      </p>
    </Card>
  );
  return href ? (
    <Link href={href} className="group block rounded-xl">
      {card}
    </Link>
  ) : (
    card
  );
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-9 text-center">
      <p className="text-sm font-medium text-muted">{message}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** 아직 구현되지 않은 화면임을 명시적으로 표시합니다. */
export function ComingSoon({ items }: { items: string[] }) {
  return (
    <Card>
      <p className="text-sm font-medium">다음 단계에서 구현될 기능</p>
      <ul className="mt-3 space-y-1.5 text-sm text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="text-gold-500">
              ◆
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

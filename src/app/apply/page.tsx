import type { Metadata } from "next";

import { ApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: "상담 신청",
  description: "MELODY 영어학원 상담 및 입학 시험 신청",
};

export default function ApplyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight text-brand-700">MELODY</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">상담 신청</h1>
        <p className="mt-2 text-sm text-muted">
          아래 정보를 남겨주시면 담당자가 확인 후 예약 시간을 안내드립니다.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <ApplyForm />
      </div>
    </main>
  );
}

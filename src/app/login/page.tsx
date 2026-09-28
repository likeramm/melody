import type { Metadata } from "next";
import Image from "next/image";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* 위쪽 가장자리에 방패색 띠를 깔아 브랜드의 무게를 줍니다. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#441f25,#5e2733_50%,#441f25)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-1.5 h-px bg-gradient-to-r from-gold-400/0 via-gold-400/80 to-gold-400/0"
      />

      <div className="relative w-full max-w-[380px]">
        <div className="mb-7 flex flex-col items-center">
          <Image
            src="/brand/eloquence-full.png"
            alt="ELOQUENCE — Liberal Arts & Communications"
            width={1279}
            height={1173}
            priority
            className="h-auto w-[200px] sm:w-[220px]"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(61,43,31,0.08)] sm:p-7">
          <p className="mb-5 text-center font-serif text-[15px] font-semibold text-brand-800">
            운영 시스템
          </p>
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center font-display text-[13px] tracking-[0.12em] text-slate-500 italic">
          The Art of Eloquent Expression
        </p>
      </div>
    </main>
  );
}

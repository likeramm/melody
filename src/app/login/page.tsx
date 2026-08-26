import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-50 to-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-brand-700">MELODY</p>
          <p className="mt-1 text-sm text-muted">통합 학원 관리 플랫폼</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          학원 상담을 원하시나요?{" "}
          <Link href="/apply" className="font-medium text-brand-600 underline underline-offset-2">
            상담 신청하기
          </Link>
        </p>
      </div>
    </main>
  );
}

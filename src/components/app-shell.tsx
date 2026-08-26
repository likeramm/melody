"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarClock,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";

import { ROLE_LABEL } from "@/lib/labels";
import { cn } from "@/components/ui";

export type NavItem = {
  href: Route;
  label: string;
  icon: keyof typeof ICONS;
};

const ICONS = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  consultations: CalendarClock,
  students: Users,
  curriculum: BookOpen,
  prompts: Sparkles,
} as const;

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "업무 대시보드", icon: "dashboard" },
  { href: "/tasks", label: "업무 관리", icon: "tasks" },
  { href: "/consultations", label: "상담 · 예약", icon: "consultations" },
  { href: "/students", label: "학생 관리", icon: "students" },
  { href: "/curriculum", label: "커리큘럼", icon: "curriculum" },
  { href: "/prompts", label: "AI 프롬프트", icon: "prompts" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        // /students/abc 처럼 하위 경로에 있어도 상위 메뉴가 활성으로 보이게 합니다.
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon size={18} aria-hidden className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserBlock({
  user,
  logoutAction,
}: {
  user: { name: string; role: Role };
  logoutAction: () => Promise<void>;
}) {
  return (
    <div className="border-t border-border pt-4">
      <div className="mb-3 px-3">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut size={18} aria-hidden />
          로그아웃
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  user,
  logoutAction,
  children,
}: {
  user: { name: string; role: Role };
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:flex">
      {/* 데스크톱 고정 사이드바 */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Link href="/dashboard" className="mb-6 block px-3">
          <p className="text-lg font-bold tracking-tight text-brand-700">MELODY</p>
          <p className="text-xs text-muted">통합 관리 플랫폼</p>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserBlock user={user} logoutAction={logoutAction} />
      </aside>

      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="text-base font-bold tracking-tight text-brand-700">
          MELODY
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu size={20} aria-hidden />
        </button>
      </header>

      {/* 모바일 서랍 메뉴 */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-3">
              <p className="text-lg font-bold tracking-tight text-brand-700">MELODY</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <UserBlock user={user} logoutAction={logoutAction} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

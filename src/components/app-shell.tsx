"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PhoneCall,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { cn } from "@/components/ui";

const ICONS = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  students: Users,
  sessions: ClipboardList,
  followups: PhoneCall,
  schedule: CalendarRange,
  curriculum: BookOpen,
  finance: Wallet,
  vendors: Truck,
} as const;

type NavItem = { href: Route; label: string; icon: keyof typeof ICONS };

/** 명세의 MVP 6개(To-do·학생·수업기록·업체·비용·일정)를 위로 모았습니다. */
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "매일 보는 것",
    items: [
      { href: "/dashboard", label: "대시보드", icon: "dashboard" },
      { href: "/tasks", label: "할 일", icon: "tasks" },
      { href: "/followups", label: "Follow-up", icon: "followups" },
    ],
  },
  {
    title: "학생",
    items: [
      { href: "/students", label: "학생 · 상담자", icon: "students" },
      { href: "/sessions", label: "수업 기록", icon: "sessions" },
    ],
  },
  {
    title: "운영",
    items: [
      { href: "/schedule", label: "학원 일정", icon: "schedule" },
      { href: "/vendors", label: "외주업체", icon: "vendors" },
      { href: "/finance", label: "회계", icon: "finance" },
      { href: "/curriculum", label: "커리큘럼", icon: "curriculum" },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-[11px] font-medium tracking-wide text-muted uppercase">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              // /students/abc 처럼 하위 경로에서도 상위 메뉴가 활성으로 보이게 합니다.
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon size={17} aria-hidden className="shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserBlock({
  user,
  logoutAction,
}: {
  user: { name: string };
  logoutAction: () => Promise<void>;
}) {
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 truncate px-3 text-sm font-semibold">{user.name}</p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut size={17} aria-hidden />
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
  user: { name: string };
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Link href="/dashboard" className="mb-5 block px-3">
          <p className="text-lg font-bold tracking-tight text-brand-700">MELODY</p>
          <p className="text-xs text-muted">학원 운영 시스템</p>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserBlock user={user} logoutAction={logoutAction} />
      </aside>

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

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card p-4 shadow-xl">
            <div className="mb-5 flex items-center justify-between px-3">
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

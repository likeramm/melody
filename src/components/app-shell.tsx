"use client";

import type { Route } from "next";
import Image from "next/image";
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

/**
 * 사이드바 상단의 문장 + 워드마크. 로고와 같은 구성입니다.
 *
 * 1366×768 노트북은 브라우저 창을 빼면 화면 높이가 700px 안팎이라
 * 문장 그림까지 넣으면 메뉴가 잘립니다. 화면이 낮으면 그림과 부제를 접고
 * 워드마크만 남겨 메뉴가 스크롤 없이 다 보이게 합니다.
 */
const SHORT = "[@media(max-height:780px)]:hidden";

function Crest({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="group flex flex-col items-center text-center">
      {!compact && (
        <Image
          src="/brand/eloquence-crest.png"
          alt=""
          width={787}
          height={823}
          priority
          className={cn("mb-2.5 h-auto w-[64px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]", SHORT)}
        />
      )}
      <span
        className={cn(
          "font-display font-semibold tracking-[0.14em] text-gold-400",
          compact ? "text-lg" : "text-[21px] leading-none",
        )}
      >
        ELOQUENCE
      </span>
      {!compact && (
        <>
          <span aria-hidden className="ornament mt-2 w-full max-w-[150px] text-gold-500/70">
            <span />
          </span>
          <span
            className={cn(
              "mt-1.5 font-display text-[9.5px] font-semibold tracking-[0.2em] text-gold-300/80 uppercase",
              SHORT,
            )}
          >
            Liberal Arts &amp; Communications
          </span>
        </>
      )}
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[10.5px] font-semibold tracking-[0.16em] text-gold-400/70 uppercase">
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
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium transition",
                    active
                      ? "bg-white/[0.07] text-gold-300"
                      : "text-[#eadfd6]/75 hover:bg-white/[0.04] hover:text-[#f6efe8]",
                  )}
                >
                  {/* 활성 메뉴의 골드 막대 */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-gold-400"
                    />
                  )}
                  <Icon size={16} aria-hidden className="shrink-0" strokeWidth={1.8} />
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
    <div className="border-t border-white/10 pt-3">
      <div className="mb-1 flex items-center gap-2.5 px-3">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-400/40 font-display text-sm font-semibold text-gold-300"
        >
          {user.name.slice(0, 1)}
        </span>
        <span className="truncate text-sm font-medium text-[#f6efe8]">{user.name}</span>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] text-[#eadfd6]/65 transition hover:bg-white/[0.04] hover:text-[#f6efe8]"
        >
          <LogOut size={15} aria-hidden strokeWidth={1.8} />
          로그아웃
        </button>
      </form>
    </div>
  );
}

/** 사이드바 바탕. 로고 방패색에서 아래로 살짝 짙어집니다. */
const SIDEBAR_BG = "bg-[linear-gradient(180deg,#4a2129_0%,#441f25_40%,#3a1a20_100%)]";

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
      <aside
        className={cn(
          "hidden w-60 shrink-0 flex-col p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh",
          SIDEBAR_BG,
        )}
      >
        <div className="px-2 pt-2 pb-5">
          <Crest />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserBlock user={user} logoutAction={logoutAction} />
      </aside>

      <header
        className={cn(
          "sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm lg:hidden",
          SIDEBAR_BG,
        )}
      >
        <Crest compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="rounded-md p-2 text-gold-300 hover:bg-white/10"
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
            className="absolute inset-0 bg-[#2a0f13]/50"
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col p-4 shadow-2xl",
              SIDEBAR_BG,
            )}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="rounded-md p-2 text-gold-300 hover:bg-white/10"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="px-2 pb-6">
              <Crest />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <UserBlock user={user} logoutAction={logoutAction} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}

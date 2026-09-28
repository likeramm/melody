import { tz } from "@date-fns/tz";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  formatDistanceToNowStrict,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";

/*
 * 모든 날짜 계산은 한국 시간 기준입니다.
 *
 * 서버(Vercel)는 세계 표준시(UTC)로 돌아가서, 시간대를 지정하지 않으면
 * 표시 시각이 9시간 늦고, 자정~오전 9시 사이에는 "오늘"이 하루 전으로 잡힙니다.
 * 그러면 대시보드의 오늘 할 일·기한 초과·오늘 수업이 통째로 하루 밀립니다.
 * 날짜를 다루는 곳은 반드시 이 파일의 함수를 거치게 해 시간대를 한 곳에서 관리합니다.
 */
export const TIME_ZONE = "Asia/Seoul";
const KST = tz(TIME_ZONE);

// 학원 업무는 월요일을 주 시작으로 봅니다.
const WEEK_OPTS = { weekStartsOn: 1 as const, in: KST };

/** date-fns 의 TZDate 를 Prisma 에 그대로 넘기지 않도록 평범한 Date 로 바꿉니다. */
const plain = (d: Date) => new Date(d.getTime());

export function todayRange(now = new Date()) {
  return { gte: plain(startOfDay(now, { in: KST })), lte: plain(endOfDay(now, { in: KST })) };
}

export function weekRange(now = new Date()) {
  return { gte: plain(startOfWeek(now, WEEK_OPTS)), lte: plain(endOfWeek(now, WEEK_OPTS)) };
}

export function monthRange(now = new Date()) {
  return { gte: plain(startOfMonth(now, { in: KST })), lte: plain(endOfMonth(now, { in: KST })) };
}

/**
 * 날짜만 저장하는 칸(@db.Date — 수업일, 업체 진행일)을 "오늘"로 조회할 때 씁니다.
 *
 * 이 칸은 시각 없이 날짜만 저장되고, Prisma 는 넘긴 Date 의 UTC 날짜 부분만 잘라 비교합니다.
 * todayRange() 를 넘기면 한국 자정이 UTC 로는 전날 15시라 어제 수업까지 딸려 나옵니다.
 * 그래서 한국 날짜를 UTC 자정으로 옮겨 "그 날짜 하나"로 비교합니다.
 */
export function todayDateOnly(now = new Date()) {
  return new Date(`${format(now, "yyyy-MM-dd", { in: KST })}T00:00:00.000Z`);
}

export function fmtDate(d: Date | null | undefined) {
  return d ? format(d, "yyyy.MM.dd", { locale: ko, in: KST }) : "—";
}

export function fmtDateTime(d: Date | null | undefined) {
  return d ? format(d, "M월 d일(E) HH:mm", { locale: ko, in: KST }) : "—";
}

export function fmtRelative(d: Date | null | undefined) {
  return d ? formatDistanceToNowStrict(d, { addSuffix: true, locale: ko }) : "—";
}

/** yyyy-MM. MonthlyReview.yearMonth 키와 회계의 월 이동에 씁니다. */
export function yearMonthOf(d: Date = new Date()) {
  return format(d, "yyyy-MM", { in: KST });
}

/** <input type="date"> 에 넣을 수 있는 형태 */
export function toDateInput(d: Date | null | undefined) {
  return d ? format(d, "yyyy-MM-dd", { in: KST }) : "";
}

/**
 * "2026-09" 같은 월 키를 한국 시간 기준 그 달 1일 정오로 바꿉니다.
 * 정오로 잡아두면 어느 시간대로 읽어도 날짜가 앞뒤 달로 넘어가지 않습니다.
 */
export function monthFromKey(key: string) {
  return new Date(`${key}-01T12:00:00+09:00`);
}

/** 월 키를 앞뒤로 옮깁니다. 예: shiftMonthKey("2026-01", -1) === "2025-12" */
export function shiftMonthKey(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** 월 키를 "2026년 9월" 로 표시합니다. */
export function fmtMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${y}년 ${m}월`;
}

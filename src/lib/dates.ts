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

// 학원 업무는 월요일을 주 시작으로 봅니다.
const WEEK_OPTS = { weekStartsOn: 1 as const };

export function todayRange(now = new Date()) {
  return { gte: startOfDay(now), lte: endOfDay(now) };
}

export function weekRange(now = new Date()) {
  return { gte: startOfWeek(now, WEEK_OPTS), lte: endOfWeek(now, WEEK_OPTS) };
}

export function monthRange(now = new Date()) {
  return { gte: startOfMonth(now), lte: endOfMonth(now) };
}

export function fmtDate(d: Date | null | undefined) {
  return d ? format(d, "yyyy.MM.dd", { locale: ko }) : "—";
}

export function fmtDateTime(d: Date | null | undefined) {
  return d ? format(d, "M월 d일(E) HH:mm", { locale: ko }) : "—";
}

export function fmtRelative(d: Date | null | undefined) {
  return d ? formatDistanceToNowStrict(d, { addSuffix: true, locale: ko }) : "—";
}

/**
 * 반복 업무가 "이번 주기에 이미 생성되었는지"를 판정하는 키.
 * Task.periodKey 에 저장되며 (templateId, periodKey) 유니크 제약이 중복 생성을 막습니다.
 */
export function periodKeyFor(rule: "DAILY" | "WEEKLY" | "MONTHLY", now = new Date()) {
  switch (rule) {
    case "DAILY":
      return format(now, "yyyy-MM-dd");
    case "WEEKLY":
      return format(startOfWeek(now, WEEK_OPTS), "yyyy-'W'II", { locale: ko });
    case "MONTHLY":
      return format(now, "yyyy-MM");
  }
}

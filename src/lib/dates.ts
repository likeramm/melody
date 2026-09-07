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

/** yyyy-MM. MonthlyReview.yearMonth 키로 씁니다. */
export function yearMonthOf(d: Date = new Date()) {
  return format(d, "yyyy-MM");
}

/** <input type="date"> 에 넣을 수 있는 형태 */
export function toDateInput(d: Date | null | undefined) {
  return d ? format(d, "yyyy-MM-dd") : "";
}

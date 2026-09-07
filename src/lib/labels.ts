// enum 값 → 화면에 노출할 한국어 라벨.
// 용어가 화면마다 달라지지 않도록 한 곳에 모읍니다.

export const ROLE_LABEL = {
  ADMIN: "원장",
  STAFF: "담당자",
} as const;

// ── 1. 프로젝트 / To-do ──────────────────────────────────────

export const TASK_PRIORITY_LABEL = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  LATER: "Later",
} as const;

export const TASK_PRIORITY_ORDER = ["P0", "P1", "P2", "LATER"] as const;

export const TASK_STATUS_LABEL = {
  PLANNED: "예정",
  IN_PROGRESS: "진행중",
  WAITING_EXTERNAL: "외부회신대기",
  DONE: "완료",
  ON_HOLD: "보류",
} as const;

export const TASK_STATUS_ORDER = [
  "PLANNED",
  "IN_PROGRESS",
  "WAITING_EXTERNAL",
  "DONE",
  "ON_HOLD",
] as const;

/** 아직 끝나지 않은 업무. 대시보드와 기본 목록의 기준입니다. */
export const OPEN_TASK_STATUSES = ["PLANNED", "IN_PROGRESS", "WAITING_EXTERNAL"] as const;

// ── 2. 학생 / 상담자 ─────────────────────────────────────────

export const STUDENT_STATUS_LABEL = {
  NEW_INQUIRY: "신규문의",
  CONSULT_BOOKED: "상담예약",
  ASSESSED: "진단완료",
  ENROLLMENT_REVIEW: "등록검토",
  ENROLLED: "등록",
  ON_LEAVE: "휴원",
  WITHDRAWN: "퇴원",
  NOT_ENROLLED: "미등록",
} as const;

/** 파이프라인 진행 순서. 보드 컬럼 순서이기도 합니다. */
export const STUDENT_STATUS_ORDER = [
  "NEW_INQUIRY",
  "CONSULT_BOOKED",
  "ASSESSED",
  "ENROLLMENT_REVIEW",
  "ENROLLED",
  "ON_LEAVE",
  "WITHDRAWN",
  "NOT_ENROLLED",
] as const;

/** 현재 학원에 다니고 있는 학생 */
export const ACTIVE_STUDENT_STATUSES = ["ENROLLED"] as const;

export const GUARDIAN_RELATION_LABEL = {
  MOTHER: "모",
  FATHER: "부",
  OTHER: "기타",
} as const;

// ── 3. 수업 기록 ─────────────────────────────────────────────

export const ATTENDANCE_STATUS_LABEL = {
  PRESENT: "출석",
  LATE: "지각",
  ABSENT: "결석",
  EXCUSED: "사유결석",
} as const;

export const ATTENDANCE_STATUS_ORDER = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;

/** 수업 기록에서 평가하는 영역. 순서가 곧 표·차트의 순서입니다. */
export const SKILL_AREAS = [
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
  { key: "debate", label: "Debate" },
] as const;

export type SkillKey = (typeof SKILL_AREAS)[number]["key"];

// ── 4. 입학시험 / 인터뷰 ─────────────────────────────────────

export const ASSESSMENT_DECISION_LABEL = {
  PASS: "Pass",
  CONDITIONAL: "Conditional",
  FAIL: "Fail",
} as const;

/** 입학시험 영역별 점수 */
export const ASSESSMENT_AREAS = [
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
] as const;

export type AssessmentAreaKey = (typeof ASSESSMENT_AREAS)[number]["key"];

// ── 5. Milestone ─────────────────────────────────────────────

export const MILESTONE_TYPE_LABEL = {
  OPENING: "개강",
  RECRUITMENT: "모집",
  PRE_REGISTRATION: "사전등록",
  SEMESTER: "학기",
  VACATION: "방학",
  SPECIAL_CLASS: "특강",
  ADMISSION_TEST: "입학시험",
  EVENT: "이벤트",
  VOLUNTEER: "봉사활동",
  PARENT_CONSULT: "학부모 상담",
  CONTENT: "콘텐츠 촬영",
  AD: "광고",
  CONSTRUCTION: "디자인·공사",
  ADMIN: "행정",
  ETC: "기타",
} as const;

export const MILESTONE_TYPE_ORDER = [
  "OPENING",
  "RECRUITMENT",
  "PRE_REGISTRATION",
  "SEMESTER",
  "VACATION",
  "SPECIAL_CLASS",
  "ADMISSION_TEST",
  "EVENT",
  "VOLUNTEER",
  "PARENT_CONSULT",
  "CONTENT",
  "AD",
  "CONSTRUCTION",
  "ADMIN",
  "ETC",
] as const;

export const MILESTONE_STATUS_LABEL = {
  PLANNED: "예정",
  IN_PROGRESS: "진행중",
  DONE: "완료",
  ON_HOLD: "보류",
} as const;

// ── 7. 회계 ──────────────────────────────────────────────────

export const PAYMENT_METHOD_LABEL = {
  CASH: "현금",
  CARD: "카드",
  TRANSFER: "계좌",
} as const;

export const PAYMENT_METHOD_ORDER = ["TRANSFER", "CARD", "CASH"] as const;

export const REVENUE_TYPE_LABEL = {
  TUITION: "교습비",
  COACHING: "코칭",
  OTHER: "기타",
} as const;

export const EXPENSE_CATEGORY_LABEL = {
  OUTSOURCING: "외주비",
  ADVERTISING: "광고비",
  FACILITY: "시설비",
  SUPPLIES: "비품",
  CONTENT: "콘텐츠",
  RENT: "임대료",
  UTILITY: "공과금",
  SALARY: "인건비",
  ETC: "기타",
} as const;

export const EXPENSE_CATEGORY_ORDER = [
  "OUTSOURCING",
  "ADVERTISING",
  "FACILITY",
  "SUPPLIES",
  "CONTENT",
  "RENT",
  "UTILITY",
  "SALARY",
  "ETC",
] as const;

// ── 8. 외주업체 ──────────────────────────────────────────────

export const VENDOR_EVENT_TYPE_LABEL = {
  INQUIRY: "의뢰",
  QUOTE: "견적",
  ORDER: "발주",
  DELIVERY: "수령",
  REVISION: "수정요청",
  PAYMENT: "결제",
  COMPLETE: "완료",
  ETC: "기타",
} as const;

export const VENDOR_EVENT_TYPE_ORDER = [
  "INQUIRY",
  "QUOTE",
  "ORDER",
  "DELIVERY",
  "REVISION",
  "PAYMENT",
  "COMPLETE",
  "ETC",
] as const;

/** 완료로 볼 수 있는 업체 이벤트. "외주 진행중" 판정에 씁니다. */
export const VENDOR_DONE_EVENTS = ["COMPLETE"] as const;

// ── 9. Follow-up ─────────────────────────────────────────────

export const CONTACT_TYPE_LABEL = {
  PHONE: "전화",
  KAKAO: "카카오톡",
  EMAIL: "이메일",
  SMS: "문자",
  VISIT: "방문",
  ETC: "기타",
} as const;

export const CONTACT_TYPE_ORDER = ["PHONE", "KAKAO", "EMAIL", "SMS", "VISIT", "ETC"] as const;

// ── 공통 포맷 ────────────────────────────────────────────────

/** 금액을 1,234,000원 형태로 표시합니다. */
export function fmtWon(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return `${amount.toLocaleString("ko-KR")}원`;
}

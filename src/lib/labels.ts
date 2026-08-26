// enum 값 → 화면에 노출할 한국어 라벨.
// UI 문구를 한 곳에 모아두어 용어가 화면마다 달라지는 것을 막습니다.

export const ROLE_LABEL = {
  ADMIN: "시스템 관리자",
  DIRECTOR: "원장",
  TEACHER: "강사",
  STAFF: "담당자",
  PARENT: "학부모",
} as const;

export const DEPARTMENT_LABEL = {
  OPERATIONS: "운영",
  MARKETING: "마케팅",
  IT: "IT",
  ACADEMIC: "학사",
  MANAGEMENT: "경영",
} as const;

export const TASK_STATUS_LABEL = {
  TODO: "대기",
  IN_PROGRESS: "진행중",
  NEED_APPROVAL: "결재 대기",
  DONE: "완료",
  ARCHIVED: "보관",
} as const;

export const TASK_PRIORITY_LABEL = {
  URGENT: "긴급",
  HIGH: "높음",
  NORMAL: "보통",
  LOW: "낮음",
} as const;

export const RECURRENCE_LABEL = {
  NONE: "반복 없음",
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
} as const;

export const ADMISSION_STAGE_LABEL = {
  INQUIRY: "문의",
  CONSULTATION: "예약/상담",
  ASSESSMENT_COMPLETED: "시험 완료",
  REGISTERED: "등록",
  WITHDRAWN: "보류",
} as const;

/** 칸반 보드의 컬럼 순서 */
export const ADMISSION_STAGE_ORDER = [
  "INQUIRY",
  "CONSULTATION",
  "ASSESSMENT_COMPLETED",
  "REGISTERED",
  "WITHDRAWN",
] as const;

export const ENGLISH_LEVEL_LABEL = {
  BEGINNER: "입문",
  ELEMENTARY: "초급",
  INTERMEDIATE: "중급",
  UPPER_INTERMEDIATE: "중상급",
  ADVANCED: "고급",
} as const;

export const CONSULTATION_STATUS_LABEL = {
  PENDING: "대기",
  CONFIRMED: "예약 확정",
  COMPLETED: "상담 완료",
  NO_SHOW: "미방문",
  CANCELLED: "취소",
} as const;

export const CONSULTATION_TYPE_LABEL = {
  NEW_INQUIRY: "신규 문의",
  ADMISSION_TEST: "입학 시험",
  PROGRESS_REVIEW: "학습 상담",
  COMPLAINT: "요청/불만",
  RE_ENROLLMENT: "재등록",
} as const;

export const LIKELIHOOD_LABEL = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
  UNKNOWN: "미정",
} as const;

export const ATTENDANCE_STATUS_LABEL = {
  PRESENT: "출석",
  LATE: "지각",
  ABSENT: "결석",
  EXCUSED: "사유결석",
} as const;

export const ASSESSMENT_TYPE_LABEL = {
  ADMISSION: "입학 시험",
  MONTHLY: "월간 평가",
  MIDTERM: "중간 평가",
  FINAL: "기말 평가",
  MOCK: "모의고사",
} as const;

export const PROMPT_CATEGORY_LABEL = {
  WORKSHEET: "워크시트",
  DISCUSSION: "토론 질문",
  MARKETING: "마케팅 카피",
  ASSESSMENT: "평가 문항",
  PARENT_REPORT: "학부모 리포트",
  ETC: "기타",
} as const;

export const GUARDIAN_RELATION_LABEL = {
  MOTHER: "모",
  FATHER: "부",
  OTHER: "기타",
} as const;

/** 평가 차트에 쓰이는 영역 정의. 순서가 곧 범례 순서입니다. */
export const SKILL_AREAS = [
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
] as const;

export type SkillKey = (typeof SKILL_AREAS)[number]["key"];

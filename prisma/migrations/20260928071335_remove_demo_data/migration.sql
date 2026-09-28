-- 구축 과정에서 화면 확인용으로 넣었던 예시 데이터를 지웁니다.
--
-- 2026-09-28 운영 DB 를 직접 조회해, 들어 있는 데이터가 전부 아래 예시뿐이고
-- 실제로 입력된 학원 데이터가 없음을 확인한 뒤 작성했습니다.
--
-- 테이블 전체를 비우지 않고 예시 데이터의 이름을 하나하나 지정합니다.
-- 이 파일은 저장소에 계속 남으므로, 어떤 환경에서 실행되더라도
-- 실제 학원 데이터를 건드릴 수 없도록 범위를 좁혀 둡니다.
--
-- 남기는 것
--   · 원장 계정
--   · 프로젝트 10개 — 요청 명세에 적힌 실제 분류라 예시가 아닙니다
--     (오픈 준비 · 사전등록 · 개강 준비 · 마케팅 · 입학 시스템 · 커리큘럼 ·
--      콘텐츠 · UMPI · 기타 To-do · 개인)
--
-- 외래 키 순서에 맞춰 지웁니다. 하위 행은 스키마의 ON DELETE CASCADE 로 함께 지워집니다.

-- 결제 · 지출 — 학생·업체를 지워도 NULL 로 남기 때문에 먼저 직접 지웁니다.
DELETE FROM "Payment"
WHERE "item" IN ('9월 교습비', '10월 교습비', '입학 등록비');

DELETE FROM "Expense"
WHERE "item" IN ('간판 디자인 착수금', '네이버 검색광고', '교재 1차 발주');

-- 할 일 — 하위 작업과 링크는 함께 지워집니다.
DELETE FROM "Task"
WHERE "title" IN (
  '간판 시안 최종 확정',
  '사전등록 신청서 폼 점검',
  '블로그 개강 안내 글 발행',
  '입학시험 문항 2차 검토',
  '교재 발주 수량 재확인',
  '홈페이지 리뉴얼 검토'
);

-- 수업 회차 — 반을 지워도 NULL 로 남기 때문에 반보다 먼저 지웁니다.
-- 학생별 수업 기록은 함께 지워집니다.
DELETE FROM "ClassSession"
WHERE "classGroupId" IN (SELECT "id" FROM "ClassGroup" WHERE "name" = 'Intermediate A')
  AND "topic" LIKE 'Week % 수업';

-- 학생 — 보호자 · 입학시험 · Portfolio · 월별 기록 · 연락 기록이 함께 지워집니다.
DELETE FROM "Student"
WHERE "name" IN ('최민준', '정하윤', '오서준', '한지우', '윤서아');

-- 외주업체 — 진행 기록 · 연락 기록이 함께 지워집니다.
DELETE FROM "Vendor"
WHERE "name" = '브랜드디자인 스튜디오';

-- 학원 일정
DELETE FROM "Milestone"
WHERE "title" IN ('2026 가을학기 공식 개강', '사전등록 모집기간', '간판 시공');

-- 수강반
DELETE FROM "ClassGroup"
WHERE "name" = 'Intermediate A';

-- 학기 — 커리큘럼과 수업(Lesson)이 함께 지워집니다.
DELETE FROM "Semester"
WHERE "name" = '2026-2';

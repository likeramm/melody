# MELODY 학원 운영 시스템

원장이 기억해야 하는 일을 시스템이 대신 챙기도록 만든 내부 운영 도구입니다.
할 일 · 학생 · 수업기록 · 업체 · 비용 · 일정이 서로 연결돼 하나의 대시보드로 모입니다.

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router) + Server Actions |
| 언어 | TypeScript |
| DB | PostgreSQL + Prisma 6 |
| 스타일 | Tailwind CSS v4 |
| 차트 | Recharts |
| 인증 | 자체 세션 (jose JWT + bcrypt), httpOnly 쿠키 |
| 배포 | Vercel + Neon |

## 시작하기

```bash
docker compose up -d
```

```bash
cp .env.example .env
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

기본 계정은 `admin@melody.kr` / `melody1234` 입니다.

### 환경 변수

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` | 애플리케이션 쿼리용 접속 문자열 |
| `DATABASE_URL_UNPOOLED` | 마이그레이션 전용 직결 연결. Vercel 에서는 Neon 연동이 자동 주입합니다 |
| `AUTH_SECRET` | 세션 JWT 서명 키. `openssl rand -base64 32` |
| `CRON_SECRET` | 시드 엔드포인트 보호용 토큰 |

## 화면 구성

| 경로 | 명세 | 설명 |
| --- | --- | --- |
| `/dashboard` | 10 | 오늘의 P0 · 이번 주 P1 · 기한 초과 · 오늘 Follow-up · 오늘 상담/시험 · 오늘 수업 · 이번 주 결제 예정 · 미납 · 외주 진행중 · 이번 달 Milestone |
| `/tasks` | 1 | 프로젝트별 To-do. P0~Later, 5개 상태, 하위 작업, 링크, 오늘·이번 주·기한 초과 자동 보기 |
| `/students` | 2 | 학생 · 상담자 통합 목록. 8단계 상태, 이름 검색, 상태 변경 |
| `/students/[id]` | 2·3·4 | 360도 뷰. 기본 정보 · 출석률 · 과제 수행률 · 영역별 추이 · 수업 기록 누적 · 입학시험 이력 · Portfolio · 연락 기록 · 결제 이력 · 월별 성장 기록 |
| `/sessions` | 3 | 수업 회차 목록 |
| `/sessions/[id]` | 3 | 학생별 출결·과제·점수·코멘트를 표로 한 번에 입력 |
| `/followups` | 9 | 학생·업체 통합 연락 기록. 오늘 연락할 사람 |
| `/schedule` | 5 | 학원 전체 일정 Milestone. 15종 유형, 완료율 |
| `/curriculum` | 6 | 학기 → 커리큘럼 → 수업. 다음 학기로 복제 |
| `/finance` | 7 | 수입 · 지출 · 미납. 월별 이동, 카테고리별 자동 합산 |
| `/vendors`, `/vendors/[id]` | 8 | 업체 정보와 진행 timeline |

## 연결 동작

명세의 자동화 항목이 어떻게 구현됐는지입니다.

| 자동화 | 구현 방식 |
| --- | --- |
| 상담자가 등록되면 기록 유지하며 상태만 변경 | 학생과 상담자가 한 테이블이라 `status` 만 바뀝니다. 상담·시험 기록은 그대로 남습니다 |
| 수업기록 입력 → 학생 Progress 자동 누적 | `ClassSession` 1건에 `StudentSessionRecord` 가 학생 수만큼 달립니다. 학생 페이지는 이 기록을 조회할 뿐이라 동기화 로직이 없습니다 |
| 과제·시험 입력 → 성취 데이터 반영 | 같은 구조. 출석률·과제 수행률·점수 추이는 기록에서 계산합니다 |
| Follow-up 날짜가 되면 오늘 할 일에 표시 | `ContactLog.nextContactAt` 이 오늘 이전이고 미처리인 건을 대시보드가 조회합니다 |
| 업무 마감일이 가까워지면 Dashboard 표시 | 오늘·이번 주·기한 초과를 각각 조회합니다 |
| 업체 결제 기록 → 비용 기록에 연결 | 진행 기록을 `결제` 로 남기면 `Expense` 가 외주비로 자동 생성되고 업체 결제일도 갱신됩니다 |
| 학생 결제 기록 → 학생 정보 + 월별 회계 반영 | `Payment` 가 학생과 회계 양쪽에서 조회됩니다. `paidAt` 이 비면 미납으로 잡힙니다 |

## 데이터 모델

`prisma/schema.prisma` 참고. 설계상 중요한 세 가지입니다.

1. **학생과 상담자는 한 테이블입니다.** 문의만 하고 등록하지 않은 사람도 지우지 않고 `NOT_ENROLLED` 상태로 남깁니다. 나중에 다시 문의해도 예전 기록이 그대로 보입니다.
2. **수업 기록은 "수업 1회" 단위로 입력합니다.** 학생별 progress 는 그 기록을 읽어 만들 뿐, 별도의 누적 테이블이 없습니다.
3. **파일은 링크(URL)로 보관합니다.** 실제 업로드는 스토리지 연동이 필요합니다.

## 아직 없는 것

- **파일 업로드** — 영수증·PPT·워크시트·결과물은 모두 링크 필드입니다. 실제 업로드는 Vercel Blob 등 스토리지 연동이 필요합니다.
- **월별/학기별 자동 요약** — `MonthlyReview` 테이블과 화면은 있으나 값은 수동 입력입니다. 자동 집계는 데이터가 쌓인 뒤에 붙이는 것이 맞습니다.
- **학생 정보 수정 폼** — 신규 등록과 상태 변경만 됩니다. 상세 항목 수정 화면이 남아 있습니다.
- **학부모용 Progress Report / PDF / 알림톡** — Phase 2.
- **자동화 테스트** — 미작성.

## 배포

GitHub 저장소를 Vercel 에 연결하고 환경 변수를 등록하면 됩니다.
빌드 스크립트가 `prisma generate && prisma migrate deploy` 를 먼저 실행하므로 마이그레이션은 자동 반영됩니다.

시드는 배포에 포함되지 않습니다. 초기 데이터가 필요하면 아래를 한 번 호출합니다.

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<배포주소>/api/admin/seed
```

> 이 엔드포인트는 초기 데이터 투입용 임시 장치입니다. 실제 운영 데이터를 넣기 시작하면
> `src/app/api/admin/seed/` 를 삭제하세요.

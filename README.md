# MELODY HQ — 통합 학원 관리 플랫폼

학원의 반복 업무를 시스템이 관리하도록 만든 사내 웹 플랫폼입니다.
업무 대시보드, 학생 CRM, 상담 예약, 커리큘럼, AI 프롬프트 라이브러리를 하나의 애플리케이션에 통합합니다.

## 기술 스택

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| 프레임워크 | Next.js 15 (App Router) | 프론트·백엔드 통합. Server Actions 로 폼 처리 |
| 언어 | TypeScript | |
| DB | PostgreSQL + Prisma 6 | |
| 스타일 | Tailwind CSS v4 | CSS-first 설정 (`src/app/globals.css`) |
| 차트 | Recharts | 평가 추이 시각화 |
| 인증 | 자체 세션 (jose JWT + bcrypt) | httpOnly 쿠키, 7일 만료 |
| 배포 | Vercel | 크론은 `vercel.json` 의 `crons` |

> 기획서 초안의 **Spring Boot + Vercel** 조합은 성립하지 않아 Next.js 풀스택으로 확정했습니다.
> Vercel 은 서버리스 런타임이라 상시 구동되는 JVM 프로세스를 올릴 수 없습니다.

## 시작하기

### 1. 데이터베이스

로컬 개발용 PostgreSQL 을 Docker 로 띄웁니다.

```bash
docker compose up -d
```

관리형 DB(Neon, Supabase 등)를 쓰려면 `.env` 의 `DATABASE_URL` 만 바꾸면 됩니다.

### 2. 환경 변수

`.env.example` 을 복사해 `.env` 를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 접속 문자열 |
| `AUTH_SECRET` | 세션 JWT 서명 키. `openssl rand -base64 32` 로 생성 |
| `CRON_SECRET` | 반복 업무 크론 보호용 토큰 |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | 시드 계정 |

### 3. 스키마 반영 및 시드

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

### 4. 개발 서버

```bash
npm run dev
```

### 시드 계정

| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 원장 | admin@melody.kr | melody1234 |
| 강사 | teacher@melody.kr | melody1234 |
| 담당자 | staff@melody.kr | melody1234 |
| 학부모 | parent@melody.kr | melody1234 |

## 화면 구성

| 경로 | 설명 | 접근 권한 |
| --- | --- | --- |
| `/login` | 로그인 | 공개 |
| `/apply` | 학부모 상담 신청 폼 | 공개 |
| `/dashboard` | 업무 대시보드 (오늘/이번 주/긴급/결재 대기) | 직원 |
| `/tasks` | 업무 목록 및 반복 규칙 관리 | 직원 |
| `/consultations` | 상담 접수·예약·Follow-up | 직원 |
| `/students` | 입학 파이프라인 보드 | 직원 |
| `/students/[id]` | 학생 360도 뷰 + 평가 차트 | 직원 |
| `/curriculum` | 학기·주차별 레슨 플랜 | 직원 |
| `/prompts` | AI 프롬프트 라이브러리 | 직원 |
| `/portal` | 학부모 포털 (자녀 성취도·출석·상담 일정) | 학부모 |

접근 제어는 `src/middleware.ts` 에서 1차로, 각 페이지의 `requireStaff()` / `requireUser()` 에서 2차로 걸립니다.
학부모 계정이 볼 수 있는 학생은 `Guardian` 테이블로 연결된 자녀뿐이며,
평가 결과는 `Assessment.parentSharedAt` 이 설정된 회차만 노출됩니다.

## 반복 업무 자동 생성

`Task.isTemplate = true` 인 레코드는 화면에 뜨지 않는 **생성 규칙**입니다.
크론이 매일 이 규칙들을 훑어 현재 주기의 Task 를 만듭니다.

- 엔드포인트: `GET /api/cron/recurring-tasks` (`Authorization: Bearer $CRON_SECRET`)
- 스케줄: `vercel.json` 의 `0 20 * * *` — **UTC 기준이므로 한국 시간 05:00** 입니다.
- 중복 방지: `@@unique([templateId, periodKey])` 가 DB 레벨에서 막습니다.
  크론이 여러 번 돌거나 인스턴스가 동시에 실행돼도 같은 주기의 Task 는 하나만 생깁니다.

수동 실행:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/recurring-tasks
```

## 데이터 모델

`prisma/schema.prisma` 참고. 주요 테이블은 다음과 같습니다.

- **User** — 계정·권한 (`ADMIN` / `DIRECTOR` / `TEACHER` / `STAFF` / `PARENT`)
- **Task** — 업무. 반복 규칙과 실제 업무를 `isTemplate` 로 구분
- **Student** — 학생 및 입학 파이프라인 단계(`AdmissionStage`)
- **Guardian** — 학부모 ↔ 학생 연결. 포털 접근 권한의 근거
- **Consultation** — 상담 접수부터 결과 기록까지. `googleEventId` 로 캘린더 연동 대비
- **Assessment** — 영역별 점수(R/L/S/W/문법/어휘) 및 학부모 공개 여부
- **Curriculum / Lesson** — 학기·주차별 레슨 플랜
- **Attendance**, **StudentNote**, **ClassGroup**, **PromptTemplate**

상담 접수 시점에는 아직 `Student` 레코드가 없을 수 있어,
`Consultation` 은 신청 폼의 학생 정보를 스냅샷 컬럼으로 함께 보관합니다.

## 아직 구현되지 않은 것

이번 단계는 스키마와 전체 골격까지입니다. 다음이 남아 있습니다.

- **쓰기 동작 전반** — 업무 생성/수정/결재 승인, 학생·평가 입력 폼. 현재 조회 화면은 읽기 전용입니다.
- **Google Calendar 2-way 동기화** — `Consultation.googleEventId` / `syncedAt` 컬럼과 화면 자리는 준비돼 있고 API 연동만 남았습니다.
- **파이프라인 드래그 앤 드롭** — `Student.stageOrder` 컬럼은 있으나 보드는 읽기 전용입니다.
- **AI 프롬프트 실행** — 변수 치환 및 Claude API 호출.
- **파일 업로드** — 수업 자료 첨부 (Vercel Blob).
- **테스트** — 자동화 테스트 미작성.

## 배포 (Vercel)

1. GitHub 저장소를 Vercel 프로젝트에 연결합니다.
2. 환경 변수 `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET` 을 등록합니다.
3. `vercel.json` 의 크론이 자동 등록됩니다 (Hobby 플랜은 하루 1회 제한).

빌드 스크립트가 `prisma generate` 를 먼저 실행하므로 별도 설정은 필요 없습니다.

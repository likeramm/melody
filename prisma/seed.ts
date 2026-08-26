import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, subMonths } from "date-fns";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@melody.kr";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "melody1234";

async function main() {
  const now = new Date();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // ── 계정 ────────────────────────────────────────────────
  const director = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      name: "김원장",
      role: "DIRECTOR",
      department: "MANAGEMENT",
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@melody.kr" },
    update: {},
    create: {
      email: "teacher@melody.kr",
      passwordHash: hash,
      name: "이강사",
      role: "TEACHER",
      department: "ACADEMIC",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@melody.kr" },
    update: {},
    create: {
      email: "staff@melody.kr",
      passwordHash: hash,
      name: "박운영",
      role: "STAFF",
      department: "OPERATIONS",
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: "parent@melody.kr" },
    update: {},
    create: {
      email: "parent@melody.kr",
      passwordHash: hash,
      name: "최수진",
      role: "PARENT",
    },
  });

  // ── 커리큘럼 & 수강반 ────────────────────────────────────
  const curriculum = await prisma.curriculum.upsert({
    where: { semester_title: { semester: "2026-2", title: "Intermediate Reading & Writing" } },
    update: {},
    create: {
      semester: "2026-2",
      title: "Intermediate Reading & Writing",
      level: "INTERMEDIATE",
      description: "중급반 2학기 커리큘럼. 논픽션 독해와 문단 쓰기를 중심으로 구성했습니다.",
      lessons: {
        create: [
          {
            week: 1,
            topic: "Introduction: Why We Read",
            objectives: "읽기 목적 파악하기 / 주제문 찾기",
            vocabulary: ["purpose", "main idea", "supporting detail", "infer", "context"],
            homework: "워크북 p.4-7",
            authorId: teacher.id,
          },
          {
            week: 2,
            topic: "Cause and Effect",
            objectives: "인과 관계 표현 익히기 / 원인-결과 문단 쓰기",
            vocabulary: ["cause", "effect", "result in", "lead to", "consequence"],
            homework: "인과 문단 1개 작성",
            authorId: teacher.id,
          },
          {
            week: 3,
            topic: "Comparing Two Texts",
            objectives: "두 지문의 관점 비교하기",
            vocabulary: ["compare", "contrast", "perspective", "similarly", "whereas"],
            homework: "비교표 완성",
            authorId: teacher.id,
          },
          {
            week: 4,
            topic: "Summarizing Non-fiction",
            objectives: "핵심만 남기고 요약하기",
            vocabulary: ["summarize", "concise", "omit", "paraphrase", "essential"],
            homework: "기사 1편 5문장 요약",
            authorId: teacher.id,
          },
        ],
      },
    },
  });

  const classGroup = await prisma.classGroup.upsert({
    where: { name: "Intermediate A" },
    update: { curriculumId: curriculum.id },
    create: {
      name: "Intermediate A",
      schedule: "월/수/금 17:00",
      capacity: 12,
      curriculumId: curriculum.id,
    },
  });

  // ── 학생 ────────────────────────────────────────────────
  const existing = await prisma.student.findFirst({ where: { name: "최민준" } });

  const minjun =
    existing ??
    (await prisma.student.create({
      data: {
        name: "최민준",
        nameEn: "Minjun Choi",
        school: "melody초등학교",
        grade: "초5",
        englishLevel: "INTERMEDIATE",
        stage: "REGISTERED",
        currentGoal: "논픽션 지문 요약을 스스로 5문장으로 정리하기",
        enrolledAt: subMonths(now, 5),
        homeroomTeacherId: teacher.id,
        classGroupId: classGroup.id,
        guardians: {
          create: {
            name: "최수진",
            phone: "010-1234-5678",
            email: "parent@melody.kr",
            relation: "MOTHER",
            isPrimary: true,
            userId: parentUser.id,
          },
        },
        assessments: {
          create: [
            {
              type: "ADMISSION",
              takenAt: subMonths(now, 5),
              reading: 62,
              listening: 58,
              speaking: 55,
              writing: 50,
              grammar: 60,
              vocabulary: 57,
              totalScore: 57,
              teacherComment: "기초 문법은 안정적이나 쓰기에서 문단 구성이 약합니다.",
              parentSharedAt: subMonths(now, 5),
              assessorId: teacher.id,
            },
            {
              type: "MONTHLY",
              takenAt: subMonths(now, 3),
              reading: 71,
              listening: 66,
              speaking: 63,
              writing: 61,
              grammar: 70,
              vocabulary: 68,
              totalScore: 67,
              teacherComment: "독해 속도가 눈에 띄게 빨라졌습니다.",
              parentSharedAt: subMonths(now, 3),
              assessorId: teacher.id,
            },
            {
              type: "MIDTERM",
              takenAt: subMonths(now, 1),
              reading: 80,
              listening: 74,
              speaking: 70,
              writing: 72,
              grammar: 78,
              vocabulary: 76,
              totalScore: 75,
              teacherComment: "쓰기 점수가 크게 올랐습니다. 스피킹 유창성만 보완하면 좋겠습니다.",
              parentSharedAt: subMonths(now, 1),
              assessorId: teacher.id,
            },
          ],
        },
        notes: {
          create: [
            {
              body: "다음 달 학교 시험 기간에는 수업을 화/목으로 옮겨 달라고 요청하셨습니다.",
              isParentRequest: true,
              authorId: staff.id,
            },
          ],
        },
      },
    }));

  // 최근 3주 출결
  if (minjun) {
    for (let i = 0; i < 12; i += 1) {
      const date = subDays(now, i * 2);
      date.setHours(0, 0, 0, 0);
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: minjun.id, date } },
        update: {},
        create: {
          studentId: minjun.id,
          classGroupId: classGroup.id,
          date,
          status: i === 3 ? "LATE" : i === 7 ? "ABSENT" : "PRESENT",
        },
      });
    }
  }

  // 파이프라인 각 단계 샘플
  const pipelineSamples = [
    { name: "정하윤", grade: "초4", stage: "INQUIRY" as const },
    { name: "오서준", grade: "중1", stage: "CONSULTATION" as const },
    { name: "한지우", grade: "초6", stage: "ASSESSMENT_COMPLETED" as const },
  ];

  for (const s of pipelineSamples) {
    const found = await prisma.student.findFirst({ where: { name: s.name } });
    if (!found) {
      await prisma.student.create({
        data: { name: s.name, grade: s.grade, stage: s.stage, englishLevel: "ELEMENTARY" },
      });
    }
  }

  // ── 상담 ────────────────────────────────────────────────
  const consultationCount = await prisma.consultation.count();
  if (consultationCount === 0) {
    await prisma.consultation.createMany({
      data: [
        {
          applicantStudentName: "정하윤",
          applicantGrade: "초4",
          applicantLevel: "ELEMENTARY",
          parentName: "정민호",
          parentPhone: "010-2222-3333",
          type: "NEW_INQUIRY",
          status: "PENDING",
          preferredAt: addDays(now, 2),
          source: "homepage",
        },
        {
          applicantStudentName: "오서준",
          applicantGrade: "중1",
          parentName: "오지영",
          parentPhone: "010-4444-5555",
          type: "ADMISSION_TEST",
          status: "CONFIRMED",
          scheduledAt: addDays(now, 1),
          counselorId: director.id,
          source: "phone",
        },
        {
          applicantStudentName: "한지우",
          applicantGrade: "초6",
          parentName: "한상우",
          parentPhone: "010-6666-7777",
          type: "ADMISSION_TEST",
          status: "COMPLETED",
          scheduledAt: subDays(now, 5),
          summary: "레벨 테스트 결과 중급 상단. 어휘력이 강점.",
          recommendedProgram: "Intermediate A",
          admissionLikelihood: "HIGH",
          followUpAt: addDays(now, 3),
          counselorId: director.id,
          source: "referral",
        },
      ],
    });
  }

  // ── 업무 (반복 규칙 + 실제 업무) ─────────────────────────
  const templates = [
    {
      title: "신규 상담 문의 확인",
      category: "일일 점검",
      recurrence: "DAILY" as const,
      assigneeId: staff.id,
    },
    {
      title: "주간 운영 리뷰 미팅",
      category: "주간 운영",
      recurrence: "WEEKLY" as const,
      assigneeId: director.id,
    },
    {
      title: "월간 주요 운영지표 점검",
      category: "경영 지표",
      recurrence: "MONTHLY" as const,
      assigneeId: director.id,
    },
  ];

  for (const t of templates) {
    const found = await prisma.task.findFirst({ where: { title: t.title, isTemplate: true } });
    if (!found) {
      await prisma.task.create({
        data: { ...t, isTemplate: true, createdById: director.id, priority: "NORMAL" },
      });
    }
  }

  const taskCount = await prisma.task.count({ where: { isTemplate: false } });
  if (taskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "9월 신규 등원생 교재 발주",
          category: "운영",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: now,
          assigneeId: staff.id,
          createdById: director.id,
        },
        {
          title: "학부모 설명회 안내문 최종 검토",
          category: "마케팅",
          status: "NEED_APPROVAL",
          priority: "URGENT",
          dueDate: now,
          assigneeId: staff.id,
          createdById: staff.id,
        },
        {
          title: "Intermediate A 3주차 워크시트 제작",
          category: "학사",
          status: "TODO",
          priority: "NORMAL",
          dueDate: addDays(now, 3),
          assigneeId: teacher.id,
          createdById: director.id,
        },
        {
          title: "홈페이지 상담 폼 연동 테스트",
          category: "IT",
          status: "TODO",
          priority: "LOW",
          dueDate: addDays(now, 5),
          assigneeId: staff.id,
          createdById: director.id,
        },
      ],
    });
  }

  // ── AI 프롬프트 라이브러리 ───────────────────────────────
  const promptCount = await prisma.promptTemplate.count();
  if (promptCount === 0) {
    await prisma.promptTemplate.createMany({
      data: [
        {
          title: "주차별 워크시트 생성",
          category: "WORKSHEET",
          description: "커리큘럼 주차 정보를 넣으면 수업용 워크시트 초안을 만듭니다.",
          variables: ["topic", "level", "vocabulary"],
          body: [
            "당신은 한국 초·중등 영어학원의 베테랑 교재 개발자입니다.",
            "",
            "주제: {{topic}}",
            "학습자 수준: {{level}}",
            "필수 어휘: {{vocabulary}}",
            "",
            "위 조건으로 A4 1장 분량의 워크시트를 만들어 주세요. 구성은 다음을 따릅니다.",
            "1) 워밍업 질문 3개 (한국어 지시문, 영어 답변)",
            "2) 150단어 내외의 짧은 지문 — 필수 어휘를 모두 자연스럽게 포함",
            "3) 이해도 확인 문제 5개 (객관식 3, 서술형 2)",
            "4) 어휘 매칭 문제",
            "5) 정답 및 교사용 해설",
          ].join("\n"),
          authorId: teacher.id,
        },
        {
          title: "수업용 토론 질문 세트",
          category: "DISCUSSION",
          description: "말하기 수업에서 바로 쓸 수 있는 단계별 토론 질문을 뽑습니다.",
          variables: ["topic", "level"],
          body: [
            "주제 '{{topic}}' 로 {{level}} 수준 학생들과 진행할 토론 질문을 만들어 주세요.",
            "",
            "- 아이스브레이킹 질문 3개 (한 문장으로 답할 수 있는 것)",
            "- 심화 질문 4개 (근거를 들어 답해야 하는 것)",
            "- 찬반이 갈리는 질문 2개",
            "- 각 질문마다 학생이 쓸 수 있는 표현 2개를 함께 제시",
          ].join("\n"),
          authorId: teacher.id,
        },
        {
          title: "학부모 리포트 코멘트 초안",
          category: "PARENT_REPORT",
          description: "평가 점수를 넣으면 학부모용 코멘트 문장을 만들어 줍니다.",
          variables: ["studentName", "scores", "goal"],
          body: [
            "학생 이름: {{studentName}}",
            "영역별 점수: {{scores}}",
            "현재 학습 목표: {{goal}}",
            "",
            "위 데이터를 바탕으로 학부모님께 보낼 코멘트를 작성해 주세요.",
            "- 존댓말, 4~6문장",
            "- 강점 → 개선이 필요한 영역 → 다음 달 학습 계획 순서",
            "- 점수를 그대로 나열하지 말고 변화의 의미를 설명할 것",
            "- 단정적인 표현 대신 관찰된 사실 위주로 서술할 것",
          ].join("\n"),
          authorId: director.id,
        },
        {
          title: "신규 모집 마케팅 카피",
          category: "MARKETING",
          description: "설명회·모집 공지에 사용할 카피 초안입니다.",
          variables: ["program", "target", "channel"],
          body: [
            "프로그램: {{program}}",
            "대상: {{target}}",
            "게시 채널: {{channel}}",
            "",
            "MELODY 영어학원의 톤앤매너(차분하고 과장 없는, 학습 효과 중심)로 카피를 작성해 주세요.",
            "- 헤드라인 3안",
            "- 본문 2안 (각 200자 내외)",
            "- 해시태그 5개",
            "- 과장 광고로 읽힐 수 있는 표현은 사용하지 마세요.",
          ].join("\n"),
          authorId: director.id,
        },
      ],
    });
  }

  console.log("시드 데이터 생성 완료");
  console.log(`  원장   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  강사   teacher@melody.kr / ${ADMIN_PASSWORD}`);
  console.log(`  담당자 staff@melody.kr / ${ADMIN_PASSWORD}`);
  console.log(`  학부모 parent@melody.kr / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

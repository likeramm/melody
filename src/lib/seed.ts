import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, subMonths } from "date-fns";

// ?? 는 빈 문자열을 통과시키므로 || 를 씁니다.
// 환경변수가 빈 값으로 등록돼 있어도 기본값으로 되돌아갑니다.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@melody.kr";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "melody1234";

/**
 * 데모용 초기 데이터를 넣습니다.
 * 모든 쓰기가 upsert 또는 존재 확인 후 생성이라 여러 번 실행해도 안전합니다.
 */
export async function seedDatabase(prisma: PrismaClient) {
  const now = new Date();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // 잘못된 환경변수로 만들어졌을 수 있는 빈 이메일 계정을 정리합니다.
  await prisma.user.deleteMany({ where: { email: "" } });

  const director = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash: hash, isActive: true },
    create: { email: ADMIN_EMAIL, passwordHash: hash, name: "원장", role: "ADMIN" },
  });

  // ── 프로젝트 (명세 1번의 예시 그대로) ──────────────────────
  const projectNames = [
    "오픈 준비",
    "사전등록",
    "개강 준비",
    "마케팅",
    "입학 시스템",
    "커리큘럼",
    "콘텐츠",
    "UMPI",
    "기타 To-do",
    "개인",
  ];

  const projects: Record<string, string> = {};
  for (const [i, name] of projectNames.entries()) {
    const p = await prisma.project.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
    projects[name] = p.id;
  }

  // ── 할 일 ─────────────────────────────────────────────────
  if ((await prisma.task.count()) === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "간판 시안 최종 확정",
          projectId: projects["오픈 준비"],
          priority: "P0",
          status: "WAITING_EXTERNAL",
          dueDate: now,
          memo: "업체 회신 대기 중",
        },
        {
          title: "사전등록 신청서 폼 점검",
          projectId: projects["사전등록"],
          priority: "P0",
          status: "IN_PROGRESS",
          dueDate: now,
        },
        {
          title: "블로그 개강 안내 글 발행",
          projectId: projects["마케팅"],
          priority: "P1",
          status: "PLANNED",
          dueDate: addDays(now, 3),
        },
        {
          title: "입학시험 문항 2차 검토",
          projectId: projects["입학 시스템"],
          priority: "P1",
          status: "PLANNED",
          dueDate: addDays(now, 5),
        },
        {
          title: "교재 발주 수량 재확인",
          projectId: projects["개강 준비"],
          priority: "P2",
          status: "PLANNED",
          dueDate: subDays(now, 2),
        },
        {
          title: "홈페이지 리뉴얼 검토",
          projectId: projects["기타 To-do"],
          priority: "LATER",
          status: "PLANNED",
        },
      ],
    });

    // 하위 작업 예시
    const parent = await prisma.task.findFirst({ where: { title: "간판 시안 최종 확정" } });
    if (parent) {
      await prisma.task.createMany({
        data: [
          { title: "색상 2안 비교", parentTaskId: parent.id, status: "DONE", priority: "P1" },
          { title: "치수 실측 재확인", parentTaskId: parent.id, status: "PLANNED", priority: "P1" },
        ],
      });
      await prisma.taskLink.create({
        data: { taskId: parent.id, label: "시안 폴더", url: "https://example.com/signage" },
      });
    }
  }

  // ── 학기 · 커리큘럼 · 수업 ─────────────────────────────────
  const semester = await prisma.semester.upsert({
    where: { name: "2026-2" },
    update: {},
    create: { name: "2026-2", startDate: subMonths(now, 1), endDate: addDays(now, 90) },
  });

  let curriculum = await prisma.curriculum.findFirst({
    where: { semesterId: semester.id, title: "Intermediate Reading & Writing" },
  });
  if (!curriculum) {
    curriculum = await prisma.curriculum.create({
      data: {
        semesterId: semester.id,
        title: "Intermediate Reading & Writing",
        level: "Intermediate",
        description: "논픽션 독해와 문단 쓰기를 중심으로 구성했습니다.",
        lessons: {
          create: [
            {
              week: 1,
              sortOrder: 0,
              topic: "Introduction: Why We Read",
              learningObjective: "읽기 목적 파악하기 / 주제문 찾기",
              reading: "Nonfiction excerpt (400 words)",
              discussionQuestions: "왜 읽는가? 읽기 전 예측은 어떻게 하는가?",
              writing: "주제문 3개 쓰기",
              assignments: "워크북 p.4-7",
            },
            {
              week: 2,
              sortOrder: 1,
              topic: "Cause and Effect",
              learningObjective: "인과 관계 표현 익히기 / 원인-결과 문단 쓰기",
              reading: "Article: Why Cities Flood",
              discussionQuestions: "이 문제의 원인은 하나인가?",
              writing: "인과 문단 1개",
              assignments: "인과 문단 제출",
            },
            {
              week: 3,
              sortOrder: 2,
              topic: "Comparing Two Texts",
              learningObjective: "두 지문의 관점 비교하기",
              writing: "비교표 완성",
              assignments: "비교표",
            },
          ],
        },
      },
    });
  }

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

  // ── 학생 · 상담자 ─────────────────────────────────────────
  const seedStudents = [
    {
      name: "최민준",
      school: "melody초등학교",
      grade: "초5",
      status: "ENROLLED" as const,
      source: "지인 소개",
      level: "Intermediate",
      classGroupId: classGroup.id,
      enrolledAt: subMonths(now, 5),
      nextGoal: "논픽션 지문을 스스로 5문장으로 요약하기",
      guardian: { name: "최수진", phone: "010-1234-5678", relation: "MOTHER" as const },
    },
    {
      name: "정하윤",
      grade: "초4",
      status: "NEW_INQUIRY" as const,
      source: "블로그",
      guardian: { name: "정민호", phone: "010-2222-3333", relation: "FATHER" as const },
    },
    {
      name: "오서준",
      grade: "중1",
      status: "CONSULT_BOOKED" as const,
      source: "전화 문의",
      consultedAt: addDays(now, 1),
      guardian: { name: "오지영", phone: "010-4444-5555", relation: "MOTHER" as const },
    },
    {
      name: "한지우",
      grade: "초6",
      status: "ASSESSED" as const,
      source: "학부모 소개",
      assessedAt: subDays(now, 5),
      assessmentResult: "레벨 테스트 결과 중급 상단. 어휘력이 강점.",
      recommendedClass: "Intermediate A",
      guardian: { name: "한상우", phone: "010-6666-7777", relation: "FATHER" as const },
    },
    {
      name: "윤서아",
      grade: "초5",
      status: "NOT_ENROLLED" as const,
      source: "전단지",
      notEnrolledReason: "거리가 멀어 통학이 어렵다고 하심",
      nextContactAt: addDays(now, 30),
      guardian: { name: "윤미경", phone: "010-8888-9999", relation: "MOTHER" as const },
    },
  ];

  const studentIds: Record<string, string> = {};
  for (const s of seedStudents) {
    const { guardian, ...data } = s;
    let found = await prisma.student.findFirst({ where: { name: s.name } });
    if (!found) {
      found = await prisma.student.create({
        data: {
          ...data,
          firstInquiryAt: subMonths(now, 6),
          guardians: { create: [{ ...guardian, isPrimary: true }] },
        },
      });
    }
    studentIds[s.name] = found.id;
  }

  // ── 수업 회차 · 학생별 기록 ────────────────────────────────
  if ((await prisma.classSession.count()) === 0) {
    const minjunId = studentIds["최민준"];
    for (let i = 5; i >= 1; i -= 1) {
      const date = subDays(now, i * 7);
      date.setHours(0, 0, 0, 0);
      const base = 60 + (6 - i) * 4;
      await prisma.classSession.create({
        data: {
          date,
          classGroupId: classGroup.id,
          topic: `Week ${6 - i} 수업`,
          content: "논픽션 지문 독해와 문단 쓰기 연습",
          homework: "워크북 해당 단원",
          teacherId: director.id,
          records: {
            create: [
              {
                studentId: minjunId,
                attendance: i === 3 ? "LATE" : "PRESENT",
                homeworkSubmitted: i !== 2,
                quizScore: base + 5,
                testScore: i % 2 === 0 ? base : null,
                reading: base + 8,
                writing: base,
                speaking: base - 4,
                debate: base - 6,
                teacherComment:
                  i === 1 ? "쓰기 문단 구성이 눈에 띄게 좋아졌습니다." : "꾸준히 참여하고 있습니다.",
              },
            ],
          },
        },
      });
    }
  }

  // ── 입학시험 ──────────────────────────────────────────────
  if ((await prisma.assessment.count()) === 0) {
    await prisma.assessment.create({
      data: {
        studentId: studentIds["한지우"],
        takenAt: subDays(now, 5),
        reading: 82,
        listening: 76,
        speaking: 70,
        writing: 74,
        grammar: 80,
        vocabulary: 85,
        totalScore: 78,
        resultSummary: "중급 상단. 어휘력이 강점이고 스피킹 보완이 필요합니다.",
        interviewNote: "학습 동기가 뚜렷하고 표현 시도가 적극적입니다.",
        decision: "PASS",
        recommendation: "Intermediate A 반 추천",
        deliveredAt: subDays(now, 3),
        assessorId: director.id,
      },
    });
  }

  // ── Milestone ─────────────────────────────────────────────
  if ((await prisma.milestone.count()) === 0) {
    await prisma.milestone.createMany({
      data: [
        {
          title: "2026 가을학기 공식 개강",
          type: "OPENING",
          goal: "정원 12명 확보",
          dueDate: addDays(now, 14),
          status: "IN_PROGRESS",
          progress: 60,
          projectId: projects["개강 준비"],
          ownerId: director.id,
        },
        {
          title: "사전등록 모집기간",
          type: "RECRUITMENT",
          startAt: subDays(now, 7),
          dueDate: addDays(now, 7),
          status: "IN_PROGRESS",
          progress: 45,
          projectId: projects["사전등록"],
          ownerId: director.id,
        },
        {
          title: "간판 시공",
          type: "CONSTRUCTION",
          dueDate: addDays(now, 10),
          status: "PLANNED",
          progress: 20,
          projectId: projects["오픈 준비"],
          ownerId: director.id,
        },
      ],
    });
  }

  // ── 외주업체 + 진행 기록 ──────────────────────────────────
  let vendor = await prisma.vendor.findFirst({ where: { name: "브랜드디자인 스튜디오" } });
  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: "브랜드디자인 스튜디오",
        field: "디자인",
        contactName: "김디자인",
        phone: "010-1111-2222",
        kakaoId: "brand_studio",
        firstContactAt: subDays(now, 14),
        quoteAmount: 1500000,
        finalAmount: 1400000,
        contractAt: subDays(now, 12),
        workDescription: "간판 및 배너 디자인",
        satisfaction: 4,
        wouldReuse: true,
        events: {
          create: [
            { date: subDays(now, 14), type: "INQUIRY", description: "디자인 의뢰" },
            { date: subDays(now, 12), type: "QUOTE", description: "견적 수령", amount: 1500000 },
            { date: subDays(now, 8), type: "DELIVERY", description: "AI 파일 수령" },
            { date: subDays(now, 6), type: "ORDER", description: "제작업체 전달" },
          ],
        },
      },
    });
  }

  // ── 회계 ──────────────────────────────────────────────────
  if ((await prisma.payment.count()) === 0) {
    await prisma.payment.createMany({
      data: [
        {
          studentId: studentIds["최민준"],
          item: "9월 교습비",
          amount: 350000,
          dueAt: subDays(now, 3),
          paidAt: subDays(now, 3),
          method: "TRANSFER",
          revenueType: "TUITION",
        },
        {
          studentId: studentIds["최민준"],
          item: "10월 교습비",
          amount: 350000,
          dueAt: addDays(now, 4),
          method: "TRANSFER",
          revenueType: "TUITION",
        },
        {
          studentId: studentIds["한지우"],
          item: "입학 등록비",
          amount: 100000,
          dueAt: subDays(now, 5),
          method: "CARD",
          revenueType: "OTHER",
        },
      ],
    });
  }

  if ((await prisma.expense.count()) === 0) {
    await prisma.expense.createMany({
      data: [
        {
          spentAt: subDays(now, 10),
          item: "간판 디자인 착수금",
          amount: 700000,
          category: "OUTSOURCING",
          vendorId: vendor.id,
          projectId: projects["오픈 준비"],
          hasTaxInvoice: true,
        },
        {
          spentAt: subDays(now, 6),
          item: "네이버 검색광고",
          amount: 300000,
          category: "ADVERTISING",
          projectId: projects["마케팅"],
        },
        {
          spentAt: subDays(now, 4),
          item: "교재 1차 발주",
          amount: 420000,
          category: "SUPPLIES",
          projectId: projects["개강 준비"],
          hasTaxInvoice: true,
        },
      ],
    });
  }

  // ── 연락 기록 / Follow-up ─────────────────────────────────
  if ((await prisma.contactLog.count()) === 0) {
    await prisma.contactLog.createMany({
      data: [
        {
          studentId: studentIds["정하윤"],
          contactedAt: subDays(now, 2),
          type: "PHONE",
          summary: "상담 일정 조율 통화. 이번 주말 방문 희망.",
          nextContactAt: now,
          followUpNeeded: true,
          ownerId: director.id,
        },
        {
          studentId: studentIds["윤서아"],
          contactedAt: subDays(now, 20),
          type: "KAKAO",
          summary: "미등록 안내. 다음 학기에 다시 연락 요청하심.",
          nextContactAt: addDays(now, 30),
          followUpNeeded: true,
          ownerId: director.id,
        },
        {
          vendorId: vendor.id,
          contactedAt: subDays(now, 1),
          type: "KAKAO",
          summary: "시공 일정 확인 요청.",
          nextContactAt: now,
          followUpNeeded: true,
          ownerId: director.id,
        },
      ],
    });
  }

  return {
    account: ADMIN_EMAIL,
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    students: await prisma.student.count(),
    sessions: await prisma.classSession.count(),
    milestones: await prisma.milestone.count(),
    vendors: await prisma.vendor.count(),
    payments: await prisma.payment.count(),
    expenses: await prisma.expense.count(),
    contactLogs: await prisma.contactLog.count(),
  };
}

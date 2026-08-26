import "server-only";

import type { RecurrenceRule } from "@prisma/client";
import { endOfDay, endOfMonth, endOfWeek } from "date-fns";

import { prisma } from "@/lib/prisma";
import { periodKeyFor } from "@/lib/dates";

/**
 * 반복 업무 자동 생성.
 *
 * isTemplate=true 인 Task 는 리스트에 노출되지 않는 "생성 규칙"입니다.
 * 이 함수는 각 규칙에 대해 현재 주기의 Task 가 있는지 확인하고 없으면 만듭니다.
 * 중복 생성은 (templateId, periodKey) 유니크 제약이 DB 레벨에서 막아주므로,
 * 크론이 하루에 여러 번 돌거나 두 인스턴스가 동시에 실행돼도 안전합니다.
 */
export async function generateRecurringTasks(now = new Date()) {
  const templates = await prisma.task.findMany({
    where: { isTemplate: true, recurrence: { not: "NONE" } },
  });

  let created = 0;
  const skipped: string[] = [];

  for (const template of templates) {
    const rule = template.recurrence as Exclude<RecurrenceRule, "NONE">;
    const periodKey = periodKeyFor(rule, now);

    try {
      await prisma.task.create({
        data: {
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          relatedLink: template.relatedLink,
          assigneeId: template.assigneeId,
          createdById: template.createdById,
          status: "TODO",
          recurrence: "NONE", // 생성된 실물 Task 는 그 자체로 반복하지 않습니다.
          isTemplate: false,
          templateId: template.id,
          periodKey,
          dueDate: dueDateFor(rule, now),
        },
      });
      created += 1;
    } catch (error) {
      // P2002 = 유니크 제약 위반. 이번 주기에 이미 생성된 것이므로 정상 동작입니다.
      if (isUniqueViolation(error)) {
        skipped.push(template.title);
        continue;
      }
      throw error;
    }
  }

  return { templates: templates.length, created, skipped };
}

function dueDateFor(rule: Exclude<RecurrenceRule, "NONE">, now: Date) {
  switch (rule) {
    case "DAILY":
      return endOfDay(now);
    case "WEEKLY":
      return endOfWeek(now, { weekStartsOn: 1 });
    case "MONTHLY":
      return endOfMonth(now);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}
